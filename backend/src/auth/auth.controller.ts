import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestWithUser } from './request-with-user.interface';

class DevLoginDto {
  @ApiProperty({ example: 'user@vaultiq.dev' })
  @IsEmail()
  email!: string;
}

class RefreshTokenDto {
  @ApiProperty({ description: 'Opaque refresh token obtained from login or previous refresh call' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Dev only] Login with an email — disabled in production' })
  async devLogin(@Body() dto: DevLoginDto) {
    return this.authService.devLogin(dto.email);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access + refresh token pair' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke all refresh tokens for the authenticated user (logout)' })
  async logout(@Req() req: RequestWithUser) {
    await this.authService.revokeAllTokens(req.user.userId);
  }
}
