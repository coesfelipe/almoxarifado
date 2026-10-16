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
import { Controller, Post, Get, Body, UseGuards, Query, Request } from '@nestjs/common';
import { MovementsService } from './movements.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { FilterMovementReportDto } from './dto/filter-movement-report.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
let MovementsController = class MovementsController {
    movementsService;
    constructor(movementsService) {
        this.movementsService = movementsService;
    }
    async getReport(filters) {
        return await this.movementsService.getReport(filters);
    }
    async searchMovements(filters) {
        return await this.movementsService.search(filters);
    }
    async create(req, createMovementDto) {
        const effectiveUserId = req.user?.userId || createMovementDto.userId || 1;
        return await this.movementsService.create({
            ...createMovementDto,
            userId: effectiveUserId,
        });
    }
    async findAll() {
        return await this.movementsService.findAll();
    }
};
__decorate([
    Get('report'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [FilterMovementReportDto]),
    __metadata("design:returntype", Promise)
], MovementsController.prototype, "getReport", null);
__decorate([
    Get('search'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [FilterMovementReportDto]),
    __metadata("design:returntype", Promise)
], MovementsController.prototype, "searchMovements", null);
__decorate([
    Post(),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateMovementDto]),
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