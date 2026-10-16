import { Movement } from '../../movements/entities/movement.entity.js';
import type { Product } from '../../products/entities/product.entity.js';
export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER"
}
export declare class User {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    passwordHash: string;
    movements: Movement[];
    products: Product[];
}
