import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
    department?: string | null;
    employeeId?: string | null;
    avatarUrl?: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_TTL = 15 * 60;       // 15 min
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─── helpers ──────────────────────────────────────────────────────────────

  private buildPayload(user: { id: string; email: string; role: string }) {
    return { email: user.email, sub: user.id, role: user.role };
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private generateRawRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.BCRYPT_ROUNDS);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  // ─── Email + Password login ───────────────────────────────────────────────

  async emailLogin(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact HR.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Single Sign-On. Please login via SSO.',
      );
    }

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  // ─── Azure SSO login ──────────────────────────────────────────────────────

  async validateUser(azureId: string) {
    return this.prisma.user.findUnique({ where: { azureId } });
  }

  async login(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department?: string | null;
    employeeId?: string | null;
    avatarUrl?: string | null;
  }): Promise<AuthResponse> {
    return this.issueTokens(user);
  }

  // ─── Token management ────────────────────────────────────────────────────

  private async issueTokens(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department?: string | null;
    employeeId?: string | null;
    avatarUrl?: string | null;
  }): Promise<AuthResponse> {
    const payload = this.buildPayload(user);
    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_TTL,
    });

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
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId },
          data: { revoked: true },
        });
      }
      throw new UnauthorizedException(
        'Refresh token is invalid, expired, or already used',
      );
    }

    const user = stored.user;

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

  async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  // ─── Dev-only fallback ────────────────────────────────────────────────────

  async devLogin(email: string): Promise<AuthResponse> {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Dev login is disabled in production');
    }
    try {
      let user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        const hash = await this.hashPassword('password123');
        user = await this.prisma.user.create({
          data: {
            email,
            passwordHash: hash,
            fullName: email
              .split('@')[0]
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            azureId: `dev-${Date.now()}-${randomBytes(4).toString('hex')}`,
            role: 'ADMIN',
          },
        });
      }
      return await this.issueTokens(user);
    } catch {
      const user = {
        id: 'mock-admin-id',
        email,
        fullName: 'Dev Admin (Offline)',
        role: 'ADMIN',
      };
      const access_token = this.jwtService.sign(this.buildPayload(user), {
        expiresIn: this.ACCESS_TOKEN_TTL,
      });
      return {
        access_token,
        refresh_token: 'mock-refresh-token',
        expires_in: this.ACCESS_TOKEN_TTL,
        user,
      };
    }
  }
}
