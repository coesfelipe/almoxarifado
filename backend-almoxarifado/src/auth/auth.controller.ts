import { Controller, Post, Get, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

/**
 * Controller responsável pelos endpoints de autenticação, registro de usuários,
 * consulta de perfil e alteração segura de credenciais.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de cadastro de novos usuários.
   * Rota: POST /auth/register
   *
   * @param body Dados de cadastro contendo nome, e-mail institucional e senha
   */
  @Post('register')
  async register(@Body() body: { username: string; email: string; password: string }) {
    return this.authService.register(body.username, body.email, body.password);
  }

  /**
   * Endpoint de login e obtenção de token JWT.
   * Rota: POST /auth/login
   *
   * @param body Credenciais de acesso (e-mail e senha)
   */
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  /**
   * Retorna os dados do perfil do usuário autenticado.
   * Rota: GET /auth/profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.profile(req.user.userId);
  }

  /**
   * Permite que o usuário autenticado altere sua própria senha.
   * Rota: PATCH /auth/change-password
   */
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

  /**
   * Permite que o usuário autenticado altere seu endereço de e-mail institucional.
   * Rota: PATCH /auth/change-email
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-email')
  async changeEmail(
    @Request() req: any,
    @Body() body: { newEmail: string; passwordPlain: string },
  ) {
    return this.authService.changeEmail(req.user.userId, body.newEmail, body.passwordPlain);
  }
}