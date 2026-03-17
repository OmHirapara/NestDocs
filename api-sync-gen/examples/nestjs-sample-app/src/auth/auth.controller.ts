import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(200)
  login(@Body() _loginDto: LoginDto): Record<string, string> {
    return { accessToken: 'jwt-token' };
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('refreshToken') _refreshToken: string): Record<string, string> {
    return { accessToken: 'new-jwt-token' };
  }

  @Post('logout')
  @HttpCode(204)
  logout(): void {
    return;
  }
}
