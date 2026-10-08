var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementsService } from './movements.service.js';
import { MovementsController } from './movements.controller.js';
import { Movement } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
let MovementsModule = class MovementsModule {
};
MovementsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Movement, Product, User])],
        controllers: [MovementsController],
        providers: [
            MovementsService,
        ],
    })
], MovementsModule);
export { MovementsModule };
//# sourceMappingURL=movements.module.js.map