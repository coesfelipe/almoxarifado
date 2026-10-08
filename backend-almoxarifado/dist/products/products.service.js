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
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Movement, MovementType } from '../movements/entities/movement.entity.js';
let ProductsService = class ProductsService {
    productRepository;
    userRepository;
    dataSource;
    constructor(productRepository, userRepository, dataSource) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    async searchProducts(query) {
        return await this.productRepository.find({
            where: {
                name: Like(`%${query}%`),
            },
            order: { name: 'ASC' },
        });
    }
    async create(createProductDto, userId = 1) {
        return await this.dataSource.transaction(async (manager) => {
            const product = manager.create(Product, createProductDto);
            const savedProduct = await manager.save(product);
            if (savedProduct.currentStock > 0) {
                const initialMovement = manager.create(Movement, {
                    type: MovementType.ENTRY,
                    quantity: savedProduct.currentStock,
                    requester: 'Cadastro Inicial de Produto',
                    description: 'Entrada automática gerada no cadastro do item',
                    userId: userId,
                    product: savedProduct,
                });
                await manager.save(initialMovement);
            }
            return savedProduct;
        });
    }
    async findAll() {
        return await this.productRepository.find();
    }
    async findOne(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: { movements: true },
        });
        if (!product) {
            throw new NotFoundException(`Produto com ID ${id} não foi encontrado.`);
        }
        return product;
    }
    async remove(id) {
        const product = await this.findOne(id);
        await this.productRepository.remove(product);
    }
    async importFromPdf(items, userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
        }
        return await this.dataSource.transaction(async (manager) => {
            const processedItems = [];
            for (const item of items) {
                let product = await manager.findOne(Product, {
                    where: { name: item.productName },
                });
                if (!product) {
                    product = manager.create(Product, {
                        name: item.productName,
                        price: item.unitPrice,
                        measurement: item.measurement,
                        category: item.category,
                        currentStock: 0,
                    });
                    product = await manager.save(product);
                }
                else {
                    product.price = item.unitPrice;
                }
                product.currentStock += item.quantity;
                await manager.save(product);
                const movement = manager.create(Movement, {
                    type: MovementType.ENTRY,
                    quantity: item.quantity,
                    requester: 'Importação de NF-e',
                    description: `Entrada via importação de nota/PDF: ${item.productName}`,
                    userId: userId,
                    product: product,
                });
                await manager.save(movement);
                processedItems.push({
                    productName: product.name,
                    addedQuantity: item.quantity,
                    newStockTotal: product.currentStock,
                    unitPrice: product.price,
                });
            }
            return {
                message: 'Nota fiscal importada e estoque atualizado com sucesso!',
                totalProductsProcessed: processedItems.length,
                details: processedItems,
            };
        });
    }
    async update(id, updateProductDto) {
        const product = await this.productRepository.preload({
            id: id,
            ...updateProductDto,
        });
        if (!product) {
            throw new NotFoundException(`Produto com ID #${id} não encontrado.`);
        }
        return this.productRepository.save(product);
    }
};
ProductsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Product)),
    __param(1, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        DataSource])
], ProductsService);
export { ProductsService };
//# sourceMappingURL=products.service.js.map