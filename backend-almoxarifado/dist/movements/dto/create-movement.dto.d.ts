import { MovementType } from '../entities/movement.entity.js';
export declare class CreateMovementDto {
    type: MovementType;
    quantity: number;
    unitPrice?: number;
    sector?: string;
    requester?: string;
    description?: string;
    userId?: number;
    productId: number;
}
