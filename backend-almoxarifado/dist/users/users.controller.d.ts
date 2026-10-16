import { UsersService, SafeUserResponse } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from './entities/user.entity.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<SafeUserResponse[]>;
    findOne(id: number): Promise<SafeUserResponse>;
    create(createUserDto: CreateUserDto): Promise<{
        id: number;
        name: string;
        email: string;
        role: UserRole;
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUserResponse>;
    remove(req: any, id: number): Promise<{
        message: string;
    }>;
}
