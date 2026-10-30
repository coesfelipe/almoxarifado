import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module.js';
import { ProductsModule } from './products/products.module.js';
import { MovementsModule } from './movements/movements.module.js';
import { AuthModule } from './auth/auth.module.js';
import { User } from './users/entities/user.entity.js';
import { Product } from './products/entities/product.entity.js';
import { Movement } from './movements/entities/movement.entity.js';

import { Category } from './categories/entities/category.entity.js';
import { CategoriesModule } from './categories/categories.module.js';
import { Sector } from './sectors/entities/sector.entity.js';
import { SectorsModule } from './sectors/sectors.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Disponibiliza o ConfigService em toda a aplicação sem precisar reimportar
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'better-sqlite3',
      database: process.env.DB_NAME,
      entities: [User, Product, Movement, Category, Sector],
      synchronize: true, // Apenas para desenvolvimento
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    MovementsModule,
    CategoriesModule,
    SectorsModule,
  ],
})
export class AppModule {}