import { MovementsService } from './movements.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { MovementType } from './entities/movement.entity.js';
export declare class MovementsController {
    private readonly movementsService;
    constructor(movementsService: MovementsService);
    searchMovements(type?: MovementType, productName?: string, productId?: number, userId?: number, startDate?: string, endDate?: string): Promise<import("./entities/movement.entity.js").Movement[]>;
    create(createMovementDto: CreateMovementDto): Promise<import("./entities/movement.entity.js").Movement>;
    findAll(): Promise<import("./entities/movement.entity.js").Movement[]>;
}
