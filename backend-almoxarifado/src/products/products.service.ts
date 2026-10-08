import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ExtractedNfeItem } from './xml-parser.service.js';
import { User } from '../users/entities/user.entity.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Movement, MovementType } from '../movements/entities/movement.entity.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async searchProducts(query: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: {
        name: Like(`%${query}%`), // Busca parcial (case-insensitive em SQLite/Postgres)
      },
      order: { name: 'ASC' },
    });}

  async create(createProductDto: CreateProductDto, userId: number = 1): Promise<Product> {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Salva o novo produto no banco
        const product = manager.create(Product, createProductDto);
        const savedProduct = await manager.save(product);

        // 2. Se houver quantidade inicial (> 0), registra automaticamente como Entrada no Histórico
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

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { movements: true }, // Inclui as movimentações atreladas ao produto
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não foi encontrado.`);
    }

    return product;
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async importFromPdf(items: ExtractedNfeItem[], userId: number) {
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
        } else {
          product.price = item.unitPrice;
        }

        // 1. Atualiza o estoque do produto
        product.currentStock += item.quantity;
        await manager.save(product);

        // 2. ⚠️ REGISTRA A ENTRADA NO HISTÓRICO DE MOVIMENTAÇÕES
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
  
  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    // 1. Prepara a entidade com as alterações
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
    });

    // 2. Lança exceção 404 caso o ID não exista
    if (!product) {
      throw new NotFoundException(`Produto com ID #${id} não encontrado.`);
    }

    // 3. Salva e retorna o produto atualizado
    return this.productRepository.save(product);
  }
  
}