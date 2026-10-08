import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, email: string, passwordPlain: string) {
    const existing = await this.usersService.findOne(email);
    if (existing) {
      throw new ConflictException('Usuário já existe');
    }

    const user = await this.usersService.create(username, email, passwordPlain);
    return { id: user.id, email: user.email };
  }

  async login(email: string, passwordPlain: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async profile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      username: user.name,
      email: user.email,
    };
  }

  async changePassword(userId: number, currentPasswordPlain: string, newPasswordPlain: string) {
    // 1. Busca o usuário pelo ID
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // 2. Valida se a senha atual está correta
    const isPasswordValid = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('A senha atual está incorreta');
    }

    // 3. Valida se a nova senha não é idêntica à atual
    if (currentPasswordPlain === newPasswordPlain) {
      throw new BadRequestException('A nova senha não pode ser igual à senha atual');
    }

    // 4. Criptografa a nova senha com bcrypt
    const newPasswordHash = await bcrypt.hash(newPasswordPlain, 10);

    // 5. Atualiza a senha através do UsersService
    await this.usersService.updatePassword(userId, newPasswordHash);

    return { message: 'Senha alterada com sucesso' };
  }

  async changeEmail(userId: number, newEmail: string, passwordPlain: string) {
    // 1. Busca o usuário pelo ID
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // 2. Verifica se o novo e-mail é idêntico ao e-mail atual
    if (user.email === newEmail) {
      throw new BadRequestException('O novo e-mail não pode ser igual ao e-mail atual');
    }

    // 3. Valida a senha para confirmação de segurança
    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha incorreta');
    }

    // 4. Verifica se o novo e-mail já pertence a outra conta
    const existingUser = await this.usersService.findOne(newEmail);
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso por outra conta');
    }

    // 5. Atualiza o e-mail no repositório/serviço de usuários
    await this.usersService.updateEmail(userId, newEmail);

    return { message: 'E-mail alterado com sucesso', email: newEmail };
  }
}