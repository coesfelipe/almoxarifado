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
        if (!user)
            throw new NotFoundException('Usuário não encontrado');
        const product = await this.productRepository.findOne({ where: { id: dto.productId } });
        if (!product)
            throw new NotFoundException('Produto não encontrado');
        if (dto.type === MovementType.EXIT && product.currentStock < dto.quantity) {
            throw new BadRequestException('Estoque insuficiente para esta operação');
        }
        return await this.dataSource.transaction(async (manager) => {
            if (dto.type === MovementType.ENTRY) {
                product.currentStock += dto.quantity;
            }
            else {
                product.currentStock -= dto.quantity;
            }
            await manager.save(product);
            const movement = manager.create(Movement, {
                type: dto.type,
                quantity: dto.quantity,
                requester: dto.requester,
                description: dto.description,
                user,
                product,
            });
            return await manager.save(movement);
        });
    }
    async findAll() {
        return this.movementRepository.find({
            relations: {
                user: true,
                product: true,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async search(filters) {
        const query = this.movementRepository
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.product', 'product')
            .leftJoinAndSelect('movement.user', 'user');
        if (filters.type) {
            query.andWhere('movement.type = :type', { type: filters.type });
        }
        if (filters.productName) {
            query.andWhere('LOWER(product.name) LIKE LOWER(:productName)', {
                productName: `%${filters.productName}%`,
            });
        }
        if (filters.productId) {
            query.andWhere('product.id = :productId', { productId: filters.productId });
        }
        if (filters.userId) {
            query.andWhere('user.id = :userId', { userId: filters.userId });
        }
        if (filters.startDate) {
            query.andWhere('movement.createdAt >= :startDate', {
                startDate: `${filters.startDate} 00:00:00`,
            });
        }
        if (filters.endDate) {
            query.andWhere('movement.createdAt <= :endDate', {
                endDate: `${filters.endDate} 23:59:59`,
            });
        }
        return await query.orderBy('movement.createdAt', 'DESC').getMany();
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