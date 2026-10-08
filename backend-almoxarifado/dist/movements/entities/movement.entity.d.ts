import type { User } from '../../users/entities/user.entity.js';
import type { Product } from '../../products/entities/product.entity.js';
export declare enum MovementType {
    ENTRY = "ENTRY",
    EXIT = "EXIT"
}
export declare class Movement {
    id: number;
    type: MovementType;
    quantity: number;
    requester?: string;
    description?: string;
    createdAt: Date;
    user: User;
    product: Product;
}
