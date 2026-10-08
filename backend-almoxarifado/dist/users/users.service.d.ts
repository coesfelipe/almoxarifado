import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    create(username: string, email: string, passwordPlain: string): Promise<User>;
    findOne(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    updatePassword(userId: number, newPasswordHash: string): Promise<void>;
    updateEmail(userId: number, newEmail: string): Promise<import("typeorm").UpdateResult>;
}
