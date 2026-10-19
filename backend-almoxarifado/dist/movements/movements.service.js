var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Movement, MovementType } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
let MovementsService = class MovementsService {
    movementRepository;
    productRepository;
    userRepository;
    dataSource;
    constructor(movementRepository, productRepository, userRepository, dataSource) {
        this.movementRepository = movementRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    async create(dto) {
        const user = await this.userRepository.findOne({ where: { id: dto.userId } });
        if (!user) {
            throw new NotFoundException(`Usuário com ID ${dto.userId} não encontrado.`);
        }
        const product = await this.productRepository.findOne({ where: { id: dto.productId } });
        if (!product) {
            throw new NotFoundException(`Produto com ID ${dto.productId} não encontrado.`);
        }
        if (dto.type === MovementType.EXIT && product.currentStock < dto.quantity) {
            throw new BadRequestException(`Estoque insuficiente para esta operação. Saldo atual: ${product.currentStock} ${product.measurement || 'UN'}, Quantidade solicitada: ${dto.quantity}.`);
        }
        const unitPrice = dto.unitPrice !== undefined && dto.unitPrice !== null
            ? Number(dto.unitPrice)
            : Number(product.price);
        const totalPrice = Number((dto.quantity * unitPrice).toFixed(2));
        return await this.dataSource.transaction(async (manager) => {
            if (dto.type === MovementType.ENTRY) {
                product.currentStock += dto.quantity;
            }
            else {
                product.currentStock -= dto.quantity;
            }
            await manager.save(Product, product);
            const movement = manager.create(Movement, {
                type: dto.type,
                quantity: dto.quantity,
                unitPrice,
                totalPrice,
                requester: dto.type === MovementType.EXIT ? (dto.requester?.trim() || undefined) : undefined,
                description: dto.description?.trim() || undefined,
                userId: user.id,
                productId: product.id,
                user,
                product,
            });
            return await manager.save(Movement, movement);
        });
    }
    async findAll() {
        const movements = await this.movementRepository.find({
            relations: {
                user: true,
                product: true,
            },
            order: { createdAt: 'DESC' },
        });
        return movements.map((m) => this.normalizeMovementValues(m));
    }
    async search(filters) {
        const movements = await this.buildSearchQuery(filters).getMany();
        return movements.map((m) => this.normalizeMovementValues(m));
    }
    async getReport(filters) {
        const rawMovements = await this.buildSearchQuery(filters).getMany();
        const movements = rawMovements.map((m) => this.normalizeMovementValues(m));
        let totalEntriesValue = 0;
        let totalExitsValue = 0;
        let totalEntriesQuantity = 0;
        let totalExitsQuantity = 0;
        for (const mov of movements) {
            const movTotal = mov.totalPrice ?? (mov.quantity * (mov.unitPrice ?? 0));
            if (mov.type === MovementType.ENTRY) {
                totalEntriesValue += movTotal;
                totalEntriesQuantity += mov.quantity;
            }
            else if (mov.type === MovementType.EXIT) {
                totalExitsValue += movTotal;
                totalExitsQuantity += mov.quantity;
            }
        }
        totalEntriesValue = Number(totalEntriesValue.toFixed(2));
        totalExitsValue = Number(totalExitsValue.toFixed(2));
        const totalSpent = totalExitsValue;
        const balanceValue = Number((totalEntriesValue - totalExitsValue).toFixed(2));
        const totalItemsQuantity = totalEntriesQuantity + totalExitsQuantity;
        const summary = {
            totalSpent,
            totalEntriesValue,
            totalExitsValue,
            balanceValue,
            totalItemsQuantity,
            totalEntriesQuantity,
            totalExitsQuantity,
            movementsCount: movements.length,
        };
        return {
            summary,
            movements,
        };
    }
    buildSearchQuery(filters) {
        const query = this.movementRepository
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.product', 'product')
            .leftJoinAndSelect('movement.user', 'user');
        if (filters.type) {
            query.andWhere('movement.type = :type', { type: filters.type });
        }
        if (filters.productName) {
            query.andWhere('LOWER(product.name) LIKE LOWER(:productName)', {
                productName: `%${filters.productName.trim()}%`,
            });
        }
        if (filters.productId) {
            query.andWhere('product.id = :productId', { productId: filters.productId });
        }
        if (filters.requester) {
            query.andWhere('LOWER(movement.requester) LIKE LOWER(:requester)', {
                requester: `%${filters.requester.trim()}%`,
            });
        }
        if (filters.userId) {
            query.andWhere('user.id = :userId', { userId: filters.userId });
        }
        if (filters.startDate) {
            query.andWhere('movement.createdAt >= :startDate', {
                startDate: `${filters.startDate.trim()} 00:00:00`,
            });
        }
        if (filters.endDate) {
            query.andWhere('movement.createdAt <= :endDate', {
                endDate: `${filters.endDate.trim()} 23:59:59`,
            });
        }
        return query.orderBy('movement.createdAt', 'DESC');
    }
    normalizeMovementValues(movement) {
        const unitPrice = movement.unitPrice !== null && movement.unitPrice !== undefined
            ? Number(movement.unitPrice)
            : (movement.product?.price ? Number(movement.product.price) : 0);
        const totalPrice = movement.totalPrice !== null && movement.totalPrice !== undefined
            ? Number(movement.totalPrice)
            : Number((movement.quantity * unitPrice).toFixed(2));
        movement.unitPrice = unitPrice;
        movement.totalPrice = totalPrice;
        return movement;
    }
};
MovementsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Movement)),
    __param(1, InjectRepository(Product)),
    __param(2, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        DataSource])
], MovementsService);
export { MovementsService };
//# sourceMappingURL=movements.service.js.map