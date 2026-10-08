var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
let AuthService = class AuthService {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async register(username, email, passwordPlain) {
        const existing = await this.usersService.findOne(email);
        if (existing) {
            throw new ConflictException('Usuário já existe');
        }
        const user = await this.usersService.create(username, email, passwordPlain);
        return { id: user.id, email: user.email };
    }
    async login(email, passwordPlain) {
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
    async profile(userId) {
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
    async changePassword(userId, currentPasswordPlain, newPasswordPlain) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }
        const isPasswordValid = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequestException('A senha atual está incorreta');
        }
        if (currentPasswordPlain === newPasswordPlain) {
            throw new BadRequestException('A nova senha não pode ser igual à senha atual');
        }
        const newPasswordHash = await bcrypt.hash(newPasswordPlain, 10);
        await this.usersService.updatePassword(userId, newPasswordHash);
        return { message: 'Senha alterada com sucesso' };
    }
    async changeEmail(userId, newEmail, passwordPlain) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }
        if (user.email === newEmail) {
            throw new BadRequestException('O novo e-mail não pode ser igual ao e-mail atual');
        }
        const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequestException('Senha incorreta');
        }
        const existingUser = await this.usersService.findOne(newEmail);
        if (existingUser) {
            throw new ConflictException('Este e-mail já está em uso por outra conta');
        }
        await this.usersService.updateEmail(userId, newEmail);
        return { message: 'E-mail alterado com sucesso', email: newEmail };
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map