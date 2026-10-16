import { IsEnum, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '../entities/movement.entity.js';

/**
 * DTO para filtragem e geração de relatórios de movimentações.
 * Suporta filtros por intervalo de datas (início e fim), tipo de movimentação,
 * produto e solicitante.
 */
export class FilterMovementReportDto {
  /**
   * Data de início do período a ser filtrado.
   * Formato esperado: YYYY-MM-DD (ex: 2026-10-01) ou ISO string.
   */
  @IsOptional()
  @IsString({ message: 'A data inicial deve ser uma string válida' })
  @Matches(/^\d{4}-\d{2}-\d{2}/, {
    message: 'A data inicial deve estar no formato AAAA-MM-DD (ex: 2026-10-01)',
  })
  startDate?: string;

  /**
   * Data de término do período a ser filtrado.
   * Formato esperado: YYYY-MM-DD (ex: 2026-10-31) ou ISO string.
   */
  @IsOptional()
  @IsString({ message: 'A data final deve ser uma string válida' })
  @Matches(/^\d{4}-\d{2}-\d{2}/, {
    message: 'A data final deve estar no formato AAAA-MM-DD (ex: 2026-10-31)',
  })
  endDate?: string;

  /**
   * Filtro opcional por tipo de movimentação:
   * - ENTRY: apenas entradas
   * - EXIT: apenas saídas
   * Se omitido, retorna ambos os tipos.
   */
  @IsOptional()
  @IsEnum(MovementType, { message: 'O tipo deve ser ENTRY ou EXIT' })
  type?: MovementType;

  /**
   * Filtro opcional por busca textual no nome do produto (busca parcial insensível a maiúsculas/minúsculas).
   */
  @IsOptional()
  @IsString({ message: 'O nome do produto deve ser texto' })
  productName?: string;

  /**
   * Filtro opcional por ID específico do produto.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID do produto deve ser um número inteiro' })
  productId?: number;

  /**
   * Filtro opcional por solicitante ou setor destinatário.
   */
  @IsOptional()
  @IsString({ message: 'O solicitante deve ser texto' })
  requester?: string;

  /**
   * Filtro opcional por ID do usuário que registrou a movimentação.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  userId?: number;
}

