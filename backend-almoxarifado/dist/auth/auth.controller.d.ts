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
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): Promise<{
        id: number;
        username: string;
        email: string;
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
