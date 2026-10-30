import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { Product } from './entities/product.entity.js';
import { XmlParserService } from './xml-parser.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]), 
    UsersModule // <-- REGISTRO OBRIGATÓRIO PARA O REPOSITÓRIO
  ],
  controllers: [ProductsController],
  providers: [ProductsService, XmlParserService],
  exports: [ProductsService, TypeOrmModule], // Exporta se outros módulos precisarem
})
export class ProductsModule {}