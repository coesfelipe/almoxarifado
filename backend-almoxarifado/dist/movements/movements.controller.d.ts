import { MovementsService, MovementReportResponse } from './movements.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { FilterMovementReportDto } from './dto/filter-movement-report.dto.js';
import { Movement } from './entities/movement.entity.js';
export declare class MovementsController {
    private readonly movementsService;
    constructor(movementsService: MovementsService);
    getReport(filters: FilterMovementReportDto): Promise<MovementReportResponse>;
    searchMovements(filters: FilterMovementReportDto): Promise<Movement[]>;
    create(req: any, createMovementDto: CreateMovementDto): Promise<Movement>;
    findAll(): Promise<Movement[]>;
}
