import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  email!: string;
  password!: string;
}

class RefreshDto {
  refresh_token!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Body: { email, password }
   * Returns: { access_token, refresh_token, expires_in, user }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    if (!dto.email || !dto.password) {
      throw new UnauthorizedException('Email and password are required');
    }
    return this.authService.emailLogin(dto.email, dto.password);
  }

  /**
   * POST /auth/refresh
   * Body: { refresh_token }
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    if (!dto.refresh_token) {
      throw new UnauthorizedException('refresh_token is required');
    }
    return this.authService.refresh(dto.refresh_token);
  }

  /**
   * POST /auth/logout
   * Revokes all refresh tokens for the current user.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any) {
    await this.authService.revokeAllTokens(req.user.sub);
  }

  /**
   * POST /auth/dev-login  (non-production only)
   * Body: { email }
   */
  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  async devLogin(@Body() body: { email: string }) {
    return this.authService.devLogin(body.email);
  }
}
