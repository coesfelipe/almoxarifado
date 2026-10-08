import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(username: string, email: string, passwordPlain: string): Promise<{
        id: number;
        email: string;
    }>;
    login(email: string, passwordPlain: string): Promise<{
        access_token: string;
    }>;
    profile(userId: number): Promise<{
        id: number;
        username: string;
        email: string;
    }>;
    changePassword(userId: number, currentPasswordPlain: string, newPasswordPlain: string): Promise<{
        message: string;
    }>;
    changeEmail(userId: number, newEmail: string, passwordPlain: string): Promise<{
        message: string;
        email: string;
    }>;
}
