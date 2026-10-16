import { AuthService } from './auth.service.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: {
        username: string;
        email: string;
        password: string;
    }): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("../users/entities/user.entity.js").UserRole;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: import("../users/entities/user.entity.js").UserRole;
        };
    }>;
    getProfile(req: any): Promise<{
        id: number;
        username: string;
        email: string;
        role: import("../users/entities/user.entity.js").UserRole;
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    changeEmail(req: any, body: {
        newEmail: string;
        passwordPlain: string;
    }): Promise<{
        message: string;
        email: string;
    }>;
}
