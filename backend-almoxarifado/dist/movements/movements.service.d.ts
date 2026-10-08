import { Repository, DataSource } from 'typeorm';
import { Movement, MovementType } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
interface SearchMovementsFilter {
    type?: MovementType;
    productName?: string;
    productId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
}
export declare class MovementsService {
    private readonly movementRepository;
    private readonly productRepository;
    private readonly userRepository;
    private readonly dataSource;
    constructor(movementRepository: Repository<Movement>, productRepository: Repository<Product>, userRepository: Repository<User>, dataSource: DataSource);
    create(dto: CreateMovementDto): Promise<Movement>;
    findAll(): Promise<Movement[]>;
    search(filters: SearchMovementsFilter): Promise<Movement[]>;
}
export {};
