import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Movement, MovementType } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';

interface SearchMovementsFilter {
  type?: MovementType;
  productName?: string;
  productId?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class MovementsService {
    
  constructor(
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMovementDto): Promise<Movement> {
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const product = await this.productRepository.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    // Validação de saída sem estoque
    if (dto.type === MovementType.EXIT && product.currentStock < dto.quantity) {
      throw new BadRequestException('Estoque insuficiente para esta operação');
    }

    // Executa a alteração no produto e registro do histórico
    return await this.dataSource.transaction(async (manager) => {
      if (dto.type === MovementType.ENTRY) {
        product.currentStock += dto.quantity;
      } else {
        product.currentStock -= dto.quantity;
      }

      await manager.save(product);

      const movement = manager.create(Movement, {
        type: dto.type,
        quantity: dto.quantity,
        requester: dto.requester,
        description: dto.description,
        user,
        product,
      });

      return await manager.save(movement);
    });
  }

    async findAll(): Promise<Movement[]> {
    return this.movementRepository.find({
        relations: {
        user: true,
        product: true,
        },
        order: { createdAt: 'DESC' },
    });
    }

    async search(filters: SearchMovementsFilter) {
    const query = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.user', 'user');

    if (filters.type) {
      query.andWhere('movement.type = :type', { type: filters.type });
    }

    if (filters.productName) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:productName)', {
        productName: `%${filters.productName}%`,
      });
    }

    if (filters.productId) {
      query.andWhere('product.id = :productId', { productId: filters.productId });
    }

    if (filters.userId) {
      query.andWhere('user.id = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      query.andWhere('movement.createdAt >= :startDate', {
        startDate: `${filters.startDate} 00:00:00`,
      });
    }

    if (filters.endDate) {
      query.andWhere('movement.createdAt <= :endDate', {
        endDate: `${filters.endDate} 23:59:59`,
      });
    }

    // Ordena das movimentações mais recentes para as mais antigas
    return await query.orderBy('movement.createdAt', 'DESC').getMany();
  }
}