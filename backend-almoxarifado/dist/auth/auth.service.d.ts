import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(username: string, email: string, passwordPlain: string, role?: any): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("../users/entities/user.entity.js").UserRole;
    }>;
    login(email: string, passwordPlain: string): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: import("../users/entities/user.entity.js").UserRole;
        };
    }>;
    profile(userId: number): Promise<{
        id: number;
        username: string;
        email: string;
        role: import("../users/entities/user.entity.js").UserRole;
    }>;
    changePassword(userId: number, currentPasswordPlain: string, newPasswordPlain: string): Promise<{
        message: string;
    }>;
    changeEmail(userId: number, newEmail: string, passwordPlain: string): Promise<{
        message: string;
        email: string;
    }>;
}
