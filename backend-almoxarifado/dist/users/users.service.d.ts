import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
export interface SafeUserResponse {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    movementsCount?: number;
}
export declare class UsersService implements OnModuleInit {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    onModuleInit(): Promise<void>;
    findAll(): Promise<SafeUserResponse[]>;
    create(usernameOrDto: string | CreateUserDto, email?: string, passwordPlain?: string, role?: UserRole): Promise<User>;
    findOne(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    findOneById(id: number): Promise<SafeUserResponse>;
    update(id: number, dto: UpdateUserDto): Promise<SafeUserResponse>;
    remove(id: number, currentUserId?: number): Promise<{
        message: string;
    }>;
    updatePassword(userId: number, newPasswordHash: string): Promise<void>;
    updateEmail(userId: number, newEmail: string): Promise<import("typeorm").UpdateResult>;
}
