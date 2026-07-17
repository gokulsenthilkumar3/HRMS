import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLoggerService } from '../common/logger/winston.logger';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private logger: WinstonLoggerService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      this.logger.warn(`Failed login attempt for ${email}`, 'AuthService');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact HR.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Wrong password for ${email}`, 'AuthService');
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${email} (${user.role})`, 'AuthService');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token  = this.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRY ?? '15m' });
    const refresh_token = this.jwt.sign(payload, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY ?? '7d', secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh' });

    return {
      access_token,
      refresh_token,
      user: {
        id:           user.id,
        email:        user.email,
        fullName:     user.fullName,
        role:         user.role,
        department:   user.department,
        designation:  user.designation,
        employeeId:   user.employeeId,
        avatarUrl:    user.avatarUrl,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh',
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException();
      const newPayload = { sub: user.id, email: user.email, role: user.role };
      return {
        access_token:  this.jwt.sign(newPayload, { expiresIn: '15m' }),
        refresh_token: this.jwt.sign(newPayload, { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh' }),
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
