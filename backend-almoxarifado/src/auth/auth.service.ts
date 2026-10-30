import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';

/**
 * Serviço responsável pela lógica de autenticação de usuários, emissão de tokens JWT,
 * verificação de credenciais e segurança de acesso (troca de senha e e-mail).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Realiza o registro de um novo usuário no sistema.
   *
   * @param username Nome de exibição do usuário
   * @param email Endereço de e-mail institucional (único)
   * @param passwordPlain Senha em texto puro a ser criptografada
   * @throws ConflictException Caso o e-mail já esteja cadastrado
   */
  async register(username: string, email: string, passwordPlain: string, role?: any) {
    const existing = await this.usersService.findOne(email);
    if (existing) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    const user = await this.usersService.create(username, email, passwordPlain, role);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  /**
   * Realiza a autenticação de credenciais e emite o token de acesso JWT.
   *
   * @param email E-mail cadastrado
   * @param passwordPlain Senha fornecida para conferência
   * @returns Token de acesso JWT (Bearer token) e dados do perfil
   * @throws UnauthorizedException Se as credenciais estiverem incorretas
   */
  async login(email: string, passwordPlain: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Retorna os dados cadastrais essenciais do perfil do usuário autenticado.
   *
   * @param userId Identificador extraído do token JWT
   */
  async profile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não localizado.');
    }
    return {
      id: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
    };
  }


  /**
   * Altera a senha do usuário autenticado após validar a senha atual.
   *
   * @param userId Identificador do usuário
   * @param currentPasswordPlain Senha atual para confirmação de identidade
   * @param newPasswordPlain Nova senha desejada
   */
  async changePassword(userId: number, currentPasswordPlain: string, newPasswordPlain: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const isPasswordValid = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('A senha atual informada está incorreta.');
    }

    if (currentPasswordPlain === newPasswordPlain) {
      throw new BadRequestException('A nova senha não pode ser idêntica à senha atual.');
    }

    const newPasswordHash = await bcrypt.hash(newPasswordPlain, 10);
    await this.usersService.updatePassword(userId, newPasswordHash);

    return { message: 'Senha alterada com sucesso!' };
  }

  /**
   * Atualiza o e-mail de acesso do usuário autenticado após verificação da senha.
   *
   * @param userId Identificador do usuário
   * @param newEmail Novo endereço de e-mail institucional
   * @param passwordPlain Senha do usuário para validação de segurança
   */
  async changeEmail(userId: number, newEmail: string, passwordPlain: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (user.email === newEmail.trim().toLowerCase()) {
      throw new BadRequestException('O novo e-mail informado é idêntico ao e-mail atual.');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha incorreta para confirmação da alteração.');
    }

    const existingUser = await this.usersService.findOne(newEmail);
    if (existingUser) {
      throw new ConflictException('Este endereço de e-mail já está em uso por outro usuário.');
    }

    await this.usersService.updateEmail(userId, newEmail);

    return { message: 'E-mail alterado com sucesso!', email: newEmail.trim().toLowerCase() };
  }
}