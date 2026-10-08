import { Movement } from '../../movements/entities/movement.entity.js';
export declare class Product {
    id: number;
    name: string;
    price: number;
    measurement: string;
    category: string;
    currentStock: number;
    movements: Movement[];
}
