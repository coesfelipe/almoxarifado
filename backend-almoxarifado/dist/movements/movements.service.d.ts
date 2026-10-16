import { Repository, DataSource } from 'typeorm';
import { Movement } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { FilterMovementReportDto } from './dto/filter-movement-report.dto.js';
export interface MovementReportSummary {
    totalSpent: number;
    totalEntriesValue: number;
    totalExitsValue: number;
    balanceValue: number;
    totalItemsQuantity: number;
    totalEntriesQuantity: number;
    totalExitsQuantity: number;
    movementsCount: number;
}
export interface MovementReportResponse {
    summary: MovementReportSummary;
    movements: Movement[];
}
export declare class MovementsService {
    private readonly movementRepository;
    private readonly productRepository;
    private readonly userRepository;
    private readonly dataSource;
    constructor(movementRepository: Repository<Movement>, productRepository: Repository<Product>, userRepository: Repository<User>, dataSource: DataSource);
    create(dto: CreateMovementDto): Promise<Movement>;
    findAll(): Promise<Movement[]>;
    search(filters: FilterMovementReportDto): Promise<Movement[]>;
    getReport(filters: FilterMovementReportDto): Promise<MovementReportResponse>;
    private buildSearchQuery;
    private normalizeMovementValues;
}
