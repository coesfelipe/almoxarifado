var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity.js';
let UsersService = class UsersService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async onModuleInit() {
        try {
            const targetAdmin = await this.userRepository.findOne({ where: { email: 'felipecoes08@gmail.com' } });
            if (targetAdmin && targetAdmin.role !== UserRole.ADMIN) {
                targetAdmin.role = UserRole.ADMIN;
                await this.userRepository.save(targetAdmin);
                console.log(`[UsersService] Usuário felipecoes08@gmail.com garantido com perfil ADMIN.`);
            }
            const adminCount = await this.userRepository.count({ where: { role: UserRole.ADMIN } });
            if (adminCount === 0) {
                const firstUser = await this.userRepository.findOne({ order: { id: 'ASC' } });
                if (firstUser) {
                    firstUser.role = UserRole.ADMIN;
                    await this.userRepository.save(firstUser);
                    console.log(`[UsersService] Usuário #${firstUser.id} (${firstUser.email}) promovido para ADMIN.`);
                }
            }
        }
        catch (e) {
        }
    }
    async findAll() {
        const users = await this.userRepository.find({
            relations: { movements: true },
            order: { id: 'ASC' },
        });
        return users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role || UserRole.USER,
            movementsCount: u.movements?.length ?? 0,
        }));
    }
    async create(usernameOrDto, email, passwordPlain, role = UserRole.USER) {
        let name;
        let userEmail;
        let pass;
        let userRole = role;
        if (typeof usernameOrDto === 'object') {
            name = usernameOrDto.name;
            userEmail = usernameOrDto.email;
            pass = usernameOrDto.password;
            userRole = usernameOrDto.role || UserRole.USER;
        }
        else {
            name = usernameOrDto;
            userEmail = email;
            pass = passwordPlain;
        }
        const normalizedEmail = userEmail.trim().toLowerCase();
        const existing = await this.findOne(normalizedEmail);
        if (existing) {
            throw new ConflictException(`Já existe um usuário com o e-mail '${normalizedEmail}'.`);
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(pass, salt);
        const user = this.userRepository.create({
            name: name.trim(),
            email: normalizedEmail,
            role: userRole,
            passwordHash,
        });
        return await this.userRepository.save(user);
    }
    async findOne(email) {
        return await this.userRepository.findOne({
            where: { email: email.trim().toLowerCase() },
        });
    }
    async findById(id) {
        return await this.userRepository.findOne({
            where: { id },
            relations: { movements: true },
        });
    }
    async findOneById(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException(`Usuário com ID #${id} não foi encontrado.`);
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || UserRole.USER,
            movementsCount: user.movements?.length ?? 0,
        };
    }
    async update(id, dto) {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException(`Usuário com ID #${id} não foi encontrado.`);
        }
        if (dto.name) {
            user.name = dto.name.trim();
        }
        if (dto.role) {
            user.role = dto.role;
        }
        if (dto.email) {
            const normalizedEmail = dto.email.trim().toLowerCase();
            if (normalizedEmail !== user.email) {
                const existing = await this.findOne(normalizedEmail);
                if (existing && existing.id !== id) {
                    throw new ConflictException(`O e-mail '${normalizedEmail}' já está sendo utilizado por outro usuário.`);
                }
                user.email = normalizedEmail;
            }
        }
        if (dto.password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(dto.password, salt);
        }
        const saved = await this.userRepository.save(user);
        return {
            id: saved.id,
            name: saved.name,
            email: saved.email,
            role: saved.role,
            movementsCount: saved.movements?.length ?? 0,
        };
    }
    async remove(id, currentUserId) {
        if (currentUserId && id === currentUserId) {
            throw new BadRequestException('Ação negada: Você não pode excluir sua própria conta de administrador.');
        }
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException(`Usuário com ID #${id} não foi encontrado.`);
        }
        await this.userRepository.remove(user);
        return { message: `Usuário '${user.name}' (#${user.id}) excluído com sucesso.` };
    }
    async updatePassword(userId, newPasswordHash) {
        await this.userRepository.update(userId, {
            passwordHash: newPasswordHash,
        });
    }
    async updateEmail(userId, newEmail) {
        return this.userRepository.update(userId, { email: newEmail.trim().toLowerCase() });
    }
};
UsersService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map