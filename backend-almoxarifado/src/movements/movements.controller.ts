import { Controller, Post, Get, Body, UseGuards, Query, Request } from '@nestjs/common';
import { MovementsService, MovementReportResponse } from './movements.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { FilterMovementReportDto } from './dto/filter-movement-report.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Movement } from './entities/movement.entity.js';

/**
 * Controller responsável pelas rotas de movimentações de estoque e relatórios.
 * Protegido integralmente com `JwtAuthGuard` exigindo autenticação do usuário.
 */
@Controller('movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  /**
   * Endpoint de relatório consolidado com indicadores (KPIs) e listagem de movimentações.
   * Rota: GET /movements/report
   *
   * Permite filtrar por:
   * - startDate: Data de início (AAAA-MM-DD)
   * - endDate: Data de término (AAAA-MM-DD)
   * - type: Tipo (ENTRY | EXIT)
   * - productName: Nome parcial do produto
   * - requester: Nome do solicitante / setor
   *
   * @param filters Parâmetros validados de busca no query string
   * @returns Resumo executivo (valor gasto total, valor entradas, saldo) e array de movimentações.
   */
  @Get('report')
  async getReport(@Query() filters: FilterMovementReportDto): Promise<MovementReportResponse> {
    return await this.movementsService.getReport(filters);
  }

  /**
   * Endpoint de busca e filtragem simples de histórico de movimentações.
   * Rota: GET /movements/search
   *
   * @param filters Critérios de filtro informados via query parameters
   * @returns Lista de movimentações correspondentes
   */
  @Get('search')
  async searchMovements(@Query() filters: FilterMovementReportDto): Promise<Movement[]> {
    return await this.movementsService.search(filters);
  }

  /**
   * Registra uma nova movimentação física e financeira no estoque.
   * Rota: POST /movements
   * Vincula automaticamente ao usuário logado extraído da sessão JWT.
   *
   * @param req Objeto da requisição HTTP contendo os dados do token autenticado
   * @param createMovementDto Dados da movimentação validados pelo class-validator
   * @returns A movimentação criada e persistida com valores contábeis e autoria
   */
  @Post()
  async create(
    @Request() req: any,
    @Body() createMovementDto: CreateMovementDto,
  ): Promise<Movement> {
    const effectiveUserId = req.user?.userId || createMovementDto.userId || 1;
    return await this.movementsService.create({
      ...createMovementDto,
      userId: effectiveUserId,
    });
  }

  /**
   * Retorna todo o histórico de movimentações sem filtros aplicados.
   * Rota: GET /movements
   *
   * @returns Todas as movimentações cadastradas ordenadas por data
   */
  @Get()
  async findAll(): Promise<Movement[]> {
    return await this.movementsService.findAll();
  }
}