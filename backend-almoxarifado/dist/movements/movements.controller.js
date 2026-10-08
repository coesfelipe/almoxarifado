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
import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { MovementsService } from './movements.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MovementType } from './entities/movement.entity.js';
let MovementsController = class MovementsController {
    movementsService;
    constructor(movementsService) {
        this.movementsService = movementsService;
    }
    async searchMovements(type, productName, productId, userId, startDate, endDate) {
        return await this.movementsService.search({
            type,
            productName,
            productId: productId ? Number(productId) : undefined,
            userId: userId ? Number(userId) : undefined,
            startDate,
            endDate,
        });
    }
    async create(createMovementDto) {
        return this.movementsService.create(createMovementDto);
    }
    async findAll() {
        return this.movementsService.findAll();
    }
};
__decorate([
    Get('search'),
    __param(0, Query('type')),
    __param(1, Query('productName')),
    __param(2, Query('productId')),
    __param(3, Query('userId')),
    __param(4, Query('startDate')),
    __param(5, Query('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], MovementsController.prototype, "searchMovements", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateMovementDto]),
    __metadata("design:returntype", Promise)
], MovementsController.prototype, "create", null);
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MovementsController.prototype, "findAll", null);
MovementsController = __decorate([
    Controller('movements'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [MovementsService])
], MovementsController);
export { MovementsController };
//# sourceMappingURL=movements.controller.js.map