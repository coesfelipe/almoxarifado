import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementsService } from './movements.service.js';
import { MovementsController } from './movements.controller.js';
import { Movement } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
@Module({
  imports: [TypeOrmModule.forFeature([Movement, Product, User])],
  controllers: [MovementsController],
  providers: [
    MovementsService,
  ],
})
export class MovementsModule {}