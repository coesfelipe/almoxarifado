import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Movement, MovementType } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { UpdateMovementDto } from './dto/update-movement.dto.js';
import { FilterMovementReportDto } from './dto/filter-movement-report.dto.js';

/**
 * Interface que representa os indicadores consolidados (KPIs) do relatório de movimentações.
 */
export interface MovementReportSummary {
  /**
   * Valor total gasto em saídas (consumo do almoxarifado) no período selecionado em R$.
   */
  totalSpent: number;

  /**
   * Valor total registrado em entradas (aquisições / abastecimento) no período selecionado em R$.
   */
  totalEntriesValue: number;

  /**
   * Valor total registrado em saídas (requisições / baixas) no período selecionado em R$.
   */
  totalExitsValue: number;

  /**
   * Saldo financeiro líquido do período (Entradas - Saídas) em R$.
   */
  balanceValue: number;

  /**
   * Volume total físico de itens movimentados (entradas + saídas).
   */
  totalItemsQuantity: number;

  /**
   * Quantidade total de itens que deram entrada no estoque.
   */
  totalEntriesQuantity: number;

  /**
   * Quantidade total de itens que saíram do estoque.
   */
  totalExitsQuantity: number;

  /**
   * Quantidade total de registros de movimentações no período.
   */
  movementsCount: number;
}

/**
 * Interface da resposta estruturada do relatório de movimentações.
 */
export interface MovementReportResponse {
  summary: MovementReportSummary;
  movements: Movement[];
}

/**
 * Serviço responsável por gerenciar a lógica de negócio das movimentações de estoque,
 * incluindo controle transacional, auditoria, validações de saldo e consolidação de relatórios.
 */
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

  /**
   * Registra uma nova movimentação física e financeira no estoque.
   * Utiliza transação gerenciada (DataSource.transaction) para garantir que
   * a atualização do saldo do produto e o registro do histórico ocorram de forma atômica (ACID).
   *
   * @param dto Dados validados da movimentação (produto, quantidade, tipo, etc.)
   * @returns A entidade Movement persistida com valores contábeis calculados.
   */
  async create(dto: CreateMovementDto): Promise<Movement> {
    // 1. Verifica a existência do usuário responsável
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${dto.userId} não encontrado.`);
    }

    // 2. Verifica a existência do produto movimentado
    const product = await this.productRepository.findOne({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${dto.productId} não encontrado.`);
    }

    // 3. Regra de negócio: Saídas não podem exceder o saldo atual em estoque
    if (dto.type === MovementType.EXIT && product.currentStock < dto.quantity) {
      throw new BadRequestException(
        `Estoque insuficiente para esta operação. Saldo atual: ${product.currentStock} ${product.measurement || 'UN'}, Quantidade solicitada: ${dto.quantity}.`,
      );
    }

    // 4. Determina o valor unitário da movimentação (prioriza o DTO, senão utiliza o preço do produto)
    const unitPrice = dto.unitPrice !== undefined && dto.unitPrice !== null
      ? Number(dto.unitPrice)
      : Number(product.price);

    // 5. Calcula o valor financeiro total da transação
    const totalPrice = Number((dto.quantity * unitPrice).toFixed(2));

    // 6. Executa a transação atômica no banco de dados
    return await this.dataSource.transaction(async (manager) => {
      // Atualiza o saldo físico do item no estoque
      if (dto.type === MovementType.ENTRY) {
        product.currentStock += dto.quantity;
      } else {
        product.currentStock -= dto.quantity;
      }

      await manager.save(Product, product);

      // Cria e persiste o registro histórico da movimentação com auditoria completa
      const movement = manager.create(Movement, {
        type: dto.type,
        quantity: dto.quantity,
        unitPrice,
        totalPrice,
        sector: dto.type === MovementType.EXIT ? (dto.sector?.trim() || dto.requester?.trim() || undefined) : undefined,
        requester: dto.type === MovementType.EXIT ? (dto.requester?.trim() || dto.sector?.trim() || undefined) : undefined,
        description: dto.description?.trim() || undefined,
        userId: user.id,
        productId: product.id,
        user,
        product,
      });

      return await manager.save(Movement, movement);
    });
  }

  /**
   * Retorna todas as movimentações cadastradas, ordenadas da mais recente para a mais antiga.
   */
  async findAll(): Promise<Movement[]> {
    const movements = await this.movementRepository.find({
      relations: {
        user: true,
        product: true,
      },
      order: { createdAt: 'DESC' },
    });

    return movements.map((m) => this.normalizeMovementValues(m));
  }

  /**
   * Busca uma movimentação específica pelo seu ID primário.
   *
   * @param id Identificador da movimentação
   * @throws NotFoundException Caso a movimentação não exista
   */
  async findOne(id: number): Promise<Movement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: {
        user: true,
        product: true,
      },
    });

    if (!movement) {
      throw new NotFoundException(`Movimentação com ID #${id} não encontrada.`);
    }

    return this.normalizeMovementValues(movement);
  }

  /**
   * Atualiza dados de uma movimentação existente e recalcula o saldo físico do estoque
   * caso a quantidade ou o tipo da movimentação tenham sido modificados.
   *
   * @param id Identificador da movimentação a atualizar
   * @param dto Dados validados para atualização
   * @returns Movimentação persistida com valores atualizados
   */
  async update(id: number, dto: UpdateMovementDto): Promise<Movement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: { product: true, user: true },
    });

    if (!movement) {
      throw new NotFoundException(`Movimentação com ID #${id} não encontrada.`);
    }

    const product = await this.productRepository.findOne({ where: { id: movement.productId } });
    if (!product) {
      throw new NotFoundException(`Produto com ID #${movement.productId} associado não encontrado.`);
    }

    return await this.dataSource.transaction(async (manager) => {
      const oldType = movement.type;
      const newType = dto.type ?? oldType;
      const oldQty = movement.quantity;
      const newQty = dto.quantity !== undefined ? dto.quantity : oldQty;

      // Se houver alteração de quantidade ou tipo, ajusta o saldo em estoque
      if (oldType !== newType || oldQty !== newQty) {
        let simulatedStock = product.currentStock;

        // Reverte o impacto da movimentação original
        if (oldType === MovementType.ENTRY) {
          simulatedStock -= oldQty;
        } else {
          simulatedStock += oldQty;
        }

        // Aplica o impacto da nova movimentação
        if (newType === MovementType.ENTRY) {
          simulatedStock += newQty;
        } else {
          simulatedStock -= newQty;
        }

        if (simulatedStock < 0) {
          throw new BadRequestException(
            `Operação inválida: O saldo de estoque ficaria negativo (${simulatedStock} ${product.measurement || 'UN'}) com esta alteração.`,
          );
        }

        product.currentStock = simulatedStock;
        await manager.save(Product, product);
      }

      if (dto.type) movement.type = dto.type;
      if (dto.quantity !== undefined) movement.quantity = dto.quantity;
      if (dto.unitPrice !== undefined) movement.unitPrice = Number(dto.unitPrice);
      if (dto.sector !== undefined) movement.sector = dto.sector.trim() || undefined;
      if (dto.requester !== undefined) movement.requester = dto.requester.trim() || undefined;
      if (dto.description !== undefined) movement.description = dto.description.trim() || undefined;

      const unitPrice = movement.unitPrice ?? (product.price ? Number(product.price) : 0);
      movement.totalPrice = Number((movement.quantity * unitPrice).toFixed(2));

      const saved = await manager.save(Movement, movement);
      return this.normalizeMovementValues(saved);
    });
  }

  /**
   * Remove uma movimentação do banco de dados e reverte atomicamente seu impacto
   * no saldo físico do produto no estoque.
   *
   * @param id Identificador da movimentação a ser removida
   * @returns Mensagem de confirmação de exclusão
   */
  async remove(id: number): Promise<{ message: string }> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: { product: true },
    });

    if (!movement) {
      throw new NotFoundException(`Movimentação com ID #${id} não encontrada.`);
    }

    const product = await this.productRepository.findOne({ where: { id: movement.productId } });

    return await this.dataSource.transaction(async (manager) => {
      if (product) {
        if (movement.type === MovementType.ENTRY) {
          if (product.currentStock < movement.quantity) {
            throw new BadRequestException(
              `Não é possível excluir esta entrada pois o saldo atual em estoque (${product.currentStock} ${product.measurement || 'UN'}) é inferior à quantidade da entrada (${movement.quantity}).`,
            );
          }
          product.currentStock -= movement.quantity;
        } else {
          product.currentStock += movement.quantity;
        }

        await manager.save(Product, product);
      }

      await manager.remove(Movement, movement);
      return { message: `Movimentação #${id} removida com sucesso.` };
    });
  }

  /**
   * Realiza busca e filtragem nas movimentações com base nos parâmetros fornecidos.
   *
   * @param filters Critérios de filtro (datas, tipo, nome do produto, etc.)
   * @returns Lista de movimentações filtradas com valores consolidados.
   */
  async search(filters: FilterMovementReportDto): Promise<Movement[]> {
    const movements = await this.buildSearchQuery(filters).getMany();
    return movements.map((m) => this.normalizeMovementValues(m));
  }

  /**
   * Gera o relatório consolidado de movimentações para o almoxarifado.
   * Filtra por período (data início e data fim) e critérios adicionais,
   * calculando valor gasto total, valor de entradas, saldo financeiro e totais de itens.
   *
   * @param filters Filtros de busca (datas, tipo de operação, produto, solicitante)
   * @returns Objeto contendo o sumário executivo e a lista completa de movimentações formatadas.
   */
  async getReport(filters: FilterMovementReportDto): Promise<MovementReportResponse> {
    // 1. Busca os registros com os filtros aplicados
    const rawMovements = await this.buildSearchQuery(filters).getMany();

    // 2. Normaliza os valores unitários e totais de cada item
    const movements = rawMovements.map((m) => this.normalizeMovementValues(m));

    // 3. Inicializa os acumuladores dos indicadores financeiros e quantitativos
    let totalEntriesValue = 0;
    let totalExitsValue = 0;
    let totalEntriesQuantity = 0;
    let totalExitsQuantity = 0;

    // 4. Itera e soma os valores com base no tipo da movimentação
    for (const mov of movements) {
      const movTotal = mov.totalPrice ?? (mov.quantity * (mov.unitPrice ?? 0));

      if (mov.type === MovementType.ENTRY) {
        totalEntriesValue += movTotal;
        totalEntriesQuantity += mov.quantity;
      } else if (mov.type === MovementType.EXIT) {
        totalExitsValue += movTotal;
        totalExitsQuantity += mov.quantity;
      }
    }

    // 5. Arredonda para 2 casas decimais para evitar erros de ponto flutuante
    totalEntriesValue = Number(totalEntriesValue.toFixed(2));
    totalExitsValue = Number(totalExitsValue.toFixed(2));
    const totalSpent = totalExitsValue; // O valor gasto total corresponde às saídas de consumo do estoque
    const balanceValue = Number((totalEntriesValue - totalExitsValue).toFixed(2));
    const totalItemsQuantity = totalEntriesQuantity + totalExitsQuantity;

    const summary: MovementReportSummary = {
      totalSpent,
      totalEntriesValue,
      totalExitsValue,
      balanceValue,
      totalItemsQuantity,
      totalEntriesQuantity,
      totalExitsQuantity,
      movementsCount: movements.length,
    };

    return {
      summary,
      movements,
    };
  }

  /**
   * Monta a consulta TypeORM com os filtros dinâmicos de busca.
   *
   * @param filters Filtros aplicáveis à consulta
   * @returns QueryBuilder pronto para execução
   */
  private buildSearchQuery(filters: FilterMovementReportDto) {
    const query = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.user', 'user');

    // Filtro por tipo de movimentação (ENTRY ou EXIT)
    if (filters.type) {
      query.andWhere('movement.type = :type', { type: filters.type });
    }

    // Filtro parcial no nome do produto (case-insensitive)
    if (filters.productName) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:productName)', {
        productName: `%${filters.productName.trim()}%`,
      });
    }

    // Filtro por ID do produto
    if (filters.productId) {
      query.andWhere('product.id = :productId', { productId: filters.productId });
    }

    // Filtro por setor
    if (filters.sector) {
      query.andWhere(
        '(LOWER(movement.sector) LIKE LOWER(:sector) OR LOWER(movement.requester) LIKE LOWER(:sector))',
        { sector: `%${filters.sector.trim()}%` },
      );
    }

    // Filtro por solicitante
    if (filters.requester) {
      query.andWhere('LOWER(movement.requester) LIKE LOWER(:requester)', {
        requester: `%${filters.requester.trim()}%`,
      });
    }

    // Filtro por ID do usuário
    if (filters.userId) {
      query.andWhere('user.id = :userId', { userId: filters.userId });
    }

    // Filtro por Data Inicial (início do dia: 00:00:00)
    if (filters.startDate) {
      query.andWhere('movement.createdAt >= :startDate', {
        startDate: `${filters.startDate.trim()} 00:00:00`,
      });
    }

    // Filtro por Data Final (término do dia: 23:59:59)
    if (filters.endDate) {
      query.andWhere('movement.createdAt <= :endDate', {
        endDate: `${filters.endDate.trim()} 23:59:59`,
      });
    }

    // Ordenação decrescente: da mais recente para a mais antiga
    return query.orderBy('movement.createdAt', 'DESC');
  }

  /**
   * Normaliza os valores de `unitPrice` e `totalPrice` da movimentação.
   * Caso o registro venha do banco sem `unitPrice` (registros antigos pré-migração),
   * realiza o fallback seguro para o preço cadastrado no Produto, garantindo
   * que os relatórios e a interface nunca recebam valores indefinidos ou nulos.
   *
   * @param movement Entidade de movimentação
   * @returns Movimentação com valores unitários e totais devidamente garantidos
   */
  private normalizeMovementValues(movement: Movement): Movement {
    const unitPrice = movement.unitPrice !== null && movement.unitPrice !== undefined
      ? Number(movement.unitPrice)
      : (movement.product?.price ? Number(movement.product.price) : 0);

    const totalPrice = movement.totalPrice !== null && movement.totalPrice !== undefined
      ? Number(movement.totalPrice)
      : Number((movement.quantity * unitPrice).toFixed(2));

    movement.unitPrice = unitPrice;
    movement.totalPrice = totalPrice;

    return movement;
  }
}