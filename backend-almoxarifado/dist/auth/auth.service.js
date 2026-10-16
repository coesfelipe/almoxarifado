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
    async register(username, email, passwordPlain, role) {
        const existing = await this.usersService.findOne(email);
        if (existing) {
            throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
        }
        const user = await this.usersService.create(username, email, passwordPlain, role);
        return { id: user.id, email: user.email, name: user.name, role: user.role };
    }
    async login(email, passwordPlain) {
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
    async profile(userId) {
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
    async changePassword(userId, currentPasswordPlain, newPasswordPlain) {
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
    async changeEmail(userId, newEmail, passwordPlain) {
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
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map