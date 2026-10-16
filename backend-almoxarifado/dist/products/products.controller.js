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
import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException, Put, Request, } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { XmlParserService } from './xml-parser.service.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
let ProductsController = class ProductsController {
    productsService;
    xmlParserService;
    constructor(productsService, xmlParserService) {
        this.productsService = productsService;
        this.xmlParserService = xmlParserService;
    }
    async search(query) {
        return this.productsService.searchProducts(query || '');
    }
    async create(req, createProductDto) {
        const userId = req.user?.userId || 1;
        return this.productsService.create(createProductDto, userId);
    }
    async update(id, updateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }
    async findAll() {
        return this.productsService.findAll();
    }
    async findOne(id) {
        return this.productsService.findOne(id);
    }
    async remove(id) {
        return this.productsService.remove(id);
    }
    async importXml(req, file, bodyUserId) {
        if (!file) {
            throw new BadRequestException('O arquivo XML da Nota Fiscal é obrigatório.');
        }
        const userId = req.user?.userId || (bodyUserId ? Number(bodyUserId) : 1);
        const extractedItems = this.xmlParserService.extractProductsFromXml(file.buffer);
        return await this.productsService.importFromPdf(extractedItems, userId);
    }
};
__decorate([
    Get('search'),
    __param(0, Query('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "search", null);
__decorate([
    Post(),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateProductDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "create", null);
__decorate([
    Put(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateProductDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "update", null);
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findOne", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "remove", null);
__decorate([
    Post('import-xml'),
    UseInterceptors(FileInterceptor('file')),
    __param(0, Request()),
    __param(1, UploadedFile()),
    __param(2, Body('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "importXml", null);
ProductsController = __decorate([
    Controller('products'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [ProductsService,
        XmlParserService])
], ProductsController);
export { ProductsController };
//# sourceMappingURL=products.controller.js.map