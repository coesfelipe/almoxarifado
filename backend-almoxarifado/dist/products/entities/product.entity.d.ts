import { Movement } from '../../movements/entities/movement.entity.js';
import type { User } from '../../users/entities/user.entity.js';
export declare class Product {
    id: number;
    name: string;
    price: number;
    measurement: string;
    category: string;
    currentStock: number;
    createdAt: Date;
    userId?: number;
    user?: User;
    movements: Movement[];
}
