import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { MovementType } from '../entities/movement.entity.js';

/**
 * DTO (Data Transfer Object) para atualização de uma movimentação existente.
 * Permite a edição de quantidade, setor destinatário, solicitante, observações ou tipo.
 */
export class UpdateMovementDto {
  /**
   * Tipo da operação (ENTRY ou EXIT).
   */
  @IsEnum(MovementType, { message: 'O tipo da movimentação deve ser ENTRY ou EXIT' })
  @IsOptional()
  type?: MovementType;

  /**
   * Quantidade de itens movimentados. Deve ser um número inteiro estritamente positivo (> 0).
   */
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @IsPositive({ message: 'A quantidade movimentada deve ser maior que zero' })
  @IsOptional()
  quantity?: number;

  /**
   * Valor unitário do item nesta movimentação em reais (R$).
   */
  @IsNumber({}, { message: 'O valor unitário deve ser um número válido' })
  @IsPositive({ message: 'O valor unitário deve ser maior que zero' })
  @IsOptional()
  unitPrice?: number;

  /**
   * Setor institucional de destino.
   */
  @IsString({ message: 'O campo setor deve ser uma string' })
  @IsOptional()
  sector?: string;

  /**
   * Nome do solicitante ou departamento responsável pelo recebimento ou retirada.
   */
  @IsString({ message: 'O campo solicitante deve ser uma string' })
  @IsOptional()
  requester?: string;

  /**
   * Justificativa, observações ou informações complementares.
   */
  @IsString({ message: 'O campo descrição deve ser uma string' })
  @IsOptional()
  description?: string;
}
