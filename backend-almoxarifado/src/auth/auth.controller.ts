import { Controller, Post, Get, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Permite que usuarios contenha os mesmo nomes, mas logo eles tem que ter e-mails institucionais diferentes.
  @Post('register')
  async register(@Body() body: { username: string, email: string; password: string }) {
    return this.authService.register(body.username, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.profile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-email')
  async changeEmail(
    @Request() req: any,
    @Body() body: { newEmail: string; passwordPlain: string },
  ) {
    // Corrigido de req.user.id para req.user.userId
    return this.authService.changeEmail(req.user.userId, body.newEmail, body.passwordPlain);
  }
}