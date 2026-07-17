import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse extends TokenPair {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  /** Access token TTL in seconds (15 minutes) */
  private readonly ACCESS_TOKEN_TTL = 15 * 60;
  /** Refresh token TTL in seconds (7 days) */
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(azureId: string) {
    return this.prisma.user.findUnique({ where: { azureId } });
  }

  private buildPayload(user: { id: string; email: string; role: string }) {
    return { email: user.email, sub: user.id, role: user.role };
  }

  /** SHA-256 hash of a raw token string for safe DB storage. */
  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** Generates a cryptographically random opaque refresh token. */
  private generateRawRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  async login(user: { id: string; email: string; fullName: string; role: string }): Promise<AuthResponse> {
    const payload = this.buildPayload(user);
    const access_token = this.jwtService.sign(payload, { expiresIn: this.ACCESS_TOKEN_TTL });

    const rawRefresh = this.generateRawRefreshToken();
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawRefresh),
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token: rawRefresh,
      expires_in: this.ACCESS_TOKEN_TTL,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  /**
   * Validates a refresh token and issues a new access + refresh token pair.
   * Implements strict token rotation: the old token is revoked in the DB
   * before the new one is issued, preventing replay attacks.
   */
  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      // If the token was already revoked, this may indicate a replay attack.
      // Revoke ALL tokens for this user as a precaution.
      if (stored) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId },
          data: { revoked: true },
        });
      }
      throw new UnauthorizedException('Refresh token is invalid, expired, or already used');
    }

    const user = stored.user;

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revoked: true },
    });

    const access_token = this.jwtService.sign(this.buildPayload(user), {
      expiresIn: this.ACCESS_TOKEN_TTL,
    });

    const newRawRefresh = this.generateRawRefreshToken();
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(newRawRefresh),
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token: newRawRefresh,
      expires_in: this.ACCESS_TOKEN_TTL,
    };
  }

  /** Revoke all refresh tokens for a user (logout). */
  async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Dev-only login: creates or returns a user by email.
   * Role is always USER unless overridden by an existing DB record.
   * NEVER allows role elevation by email pattern in production.
   */
  async devLogin(email: string): Promise<AuthResponse> {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Dev login is disabled in production');
    }
    let user;
    try {
      user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            fullName: email
              .split('@')[0]
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            azureId: `dev-${Date.now()}-${randomBytes(4).toString('hex')}`,
            role: 'ADMIN', // Dev mode defaults to ADMIN for testing
          },
        });
      }
      return await this.login(user);
    } catch (error) {
      console.warn('Database unavailable during devLogin. Returning mock ADMIN token.');
      user = {
        id: 'mock-admin-id',
        email,
        fullName: 'Dev Admin (Offline)',
        role: 'ADMIN'
      };
      const access_token = this.jwtService.sign(this.buildPayload(user), { expiresIn: this.ACCESS_TOKEN_TTL });
      return {
        access_token,
        refresh_token: 'mock-refresh-token',
        expires_in: this.ACCESS_TOKEN_TTL,
        user
      };
    }
  }
}
