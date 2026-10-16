import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ExtractedNfeItem } from './xml-parser.service.js';
import { User } from '../users/entities/user.entity.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Movement, MovementType } from '../movements/entities/movement.entity.js';

/**
 * Serviço responsável por gerenciar as operações de negócio relacionadas aos produtos
 * do estoque, incluindo cadastro, consulta, atualização, exclusão e importação de NF-e.
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Realiza busca textual parcial por nome de produto (case-insensitive).
   *
   * @param query Termo de busca digitado pelo usuário
   * @returns Lista de produtos ordenados alfabeticamente
   */
  async searchProducts(query: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: {
        name: Like(`%${query.trim()}%`),
      },
      relations: { user: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Cadastra um novo produto no catálogo do almoxarifado associando-o ao usuário que o criou.
   * Se o produto for cadastrado com saldo inicial (currentStock > 0), o sistema
   * gera automaticamente um registro de movimentação de ENTRADA com os devidos
   * valores unitários e totais calculados, mantendo o histórico 100% auditável.
   *
   * @param createProductDto Dados validados do produto a ser cadastrado
   * @param userId Identificador do usuário operador
   * @returns Produto persistido no banco de dados com autor vinculado
   */
  async create(createProductDto: CreateProductDto, userId: number = 1): Promise<Product> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Busca o usuário que está registrando o produto para vincular ao produto e à movimentação inicial
      let user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        user = await manager.findOne(User, { where: {} });
      }

      // 2. Cria e salva o novo produto no banco de dados com vínculo de autoria
      const product = manager.create(Product, {
        name: createProductDto.name.trim(),
        price: Number(createProductDto.price),
        category: createProductDto.category.trim(),
        measurement: createProductDto.measurement.trim().toUpperCase(),
        currentStock: createProductDto.currentStock ? Number(createProductDto.currentStock) : 0,
        userId: user?.id,
        user: user ?? undefined,
      });

      const savedProduct = await manager.save(Product, product);

      // 3. Se houver quantidade inicial informada (> 0), registra automaticamente como ENTRADA
      if (savedProduct.currentStock > 0) {
        const unitPrice = Number(savedProduct.price);
        const totalPrice = Number((savedProduct.currentStock * unitPrice).toFixed(2));

        const initialMovement = manager.create(Movement, {
          type: MovementType.ENTRY,
          quantity: savedProduct.currentStock,
          unitPrice,
          totalPrice,
          requester: 'Cadastro Inicial de Produto',
          description: 'Entrada automática gerada no cadastro do item no sistema',
          userId: user?.id ?? userId,
          productId: savedProduct.id,
          user: user ?? undefined,
          product: savedProduct,
        });

        await manager.save(Movement, initialMovement);
      }

      return savedProduct;
    });
  }

  /**
   * Retorna a listagem de todos os produtos cadastrados no almoxarifado com o usuário que os cadastrou.
   */
  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: { user: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Busca um produto específico pelo seu ID primário, incluindo o autor e histórico de movimentações.
   *
   * @param id Identificador numérico do produto
   * @throws NotFoundException Caso o produto não seja encontrado
   */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        user: true,
        movements: {
          user: true,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID #${id} não foi encontrado.`);
    }

    return product;
  }

  /**
   * Remove um produto do banco de dados pelo seu ID.
   *
   * @param id Identificador do produto a ser excluído
   */
  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  /**
   * Processa a importação em lote de produtos a partir dos dados extraídos do XML de NF-e.
   * - Caso o produto já exista (mesmo nome), atualiza o preço de referência e soma o estoque.
   * - Caso seja novo, cadastra o produto.
   * - Em ambos os casos, registra a movimentação de ENTRADA com preço unitário e valor total da nota.
   *
   * @param items Lista de itens estruturados da NF-e
   * @param userId Identificador do usuário que realizou o upload da nota
   * @returns Relatório de processamento com itens adicionados e saldo atualizado
   */
  async importFromPdf(items: ExtractedNfeItem[], userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }

    return await this.dataSource.transaction(async (manager) => {
      const processedItems = [];

      for (const item of items) {
        // Verifica se o item já existe pelo nome exato
        let product = await manager.findOne(Product, {
          where: { name: item.productName },
        });

        const unitPrice = Number(item.unitPrice || 0);
        const itemQuantity = Number(item.quantity || 0);
        const totalPrice = Number((itemQuantity * unitPrice).toFixed(2));

        if (!product) {
          // Cria o produto se for inexistente com o usuário importador como autor
          product = manager.create(Product, {
            name: item.productName,
            price: unitPrice,
            measurement: item.measurement,
            category: item.category,
            currentStock: 0,
            userId: user.id,
            user,
          });
          product = await manager.save(Product, product);
        } else {
          // Se já existir, atualiza o preço unitário de referência
          product.price = unitPrice;
        }

        // 1. Atualiza o saldo físico no estoque
        product.currentStock += itemQuantity;
        await manager.save(Product, product);

        // 2. Registra a movimentação de ENTRADA com valores financeiros congelados
        const movement = manager.create(Movement, {
          type: MovementType.ENTRY,
          quantity: itemQuantity,
          unitPrice,
          totalPrice,
          requester: 'Importação de NF-e',
          description: `Entrada via importação de NF-e: ${item.productName}`,
          userId: user.id,
          productId: product.id,
          user,
          product,
        });
        await manager.save(Movement, movement);

        processedItems.push({
          productName: product.name,
          addedQuantity: itemQuantity,
          newStockTotal: product.currentStock,
          unitPrice: product.price,
          totalPrice,
        });
      }

      return {
        message: 'Nota fiscal importada e estoque atualizado com sucesso!',
        totalProductsProcessed: processedItems.length,
        details: processedItems,
      };
    });
  }

  /**
   * Atualiza os dados cadastrais de um produto existente.
   *
   * @param id Identificador do produto a atualizar
   * @param updateProductDto Campos a serem alterados
   * @returns Produto com os novos dados persistidos
   */
  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID #${id} não encontrado.`);
    }

    return await this.productRepository.save(product);
  }
}