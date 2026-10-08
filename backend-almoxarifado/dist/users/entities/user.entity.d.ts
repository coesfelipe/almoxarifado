import { Movement } from '../../movements/entities/movement.entity.js';
export declare class User {
    id: number;
    email: string;
    name: string;
    passwordHash: string;
    movements: Movement[];
}
