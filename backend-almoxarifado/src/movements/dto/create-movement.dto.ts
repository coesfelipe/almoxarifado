import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { MovementType } from '../entities/movement.entity.js';

/**
 * DTO (Data Transfer Object) para registro de nova movimentação no estoque.
 * Valida a integridade dos dados recebidos no corpo da requisição (HTTP POST /movements).
 */
export class CreateMovementDto {
  /**
   * Tipo da operação:
   * - 'ENTRY': Entrada no almoxarifado (incrementa saldo).
   * - 'EXIT': Saída do almoxarifado (decrementa saldo com validação prévia).
   */
  @IsEnum(MovementType, { message: 'O tipo da movimentação deve ser ENTRY ou EXIT' })
  type: MovementType;

  /**
   * Quantidade de itens a serem movimentados. Deve ser um número inteiro estritamente positivo (> 0).
   */
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @IsPositive({ message: 'A quantidade movimentada deve ser maior que zero' })
  quantity: number;

  /**
   * Valor unitário do item nesta movimentação em reais (R$).
   * Opcional: Se não for informado, o sistema utilizará automaticamente o preço cadastrado no Produto.
   */
  @IsNumber({}, { message: 'O valor unitário deve ser um número válido' })
  @IsPositive({ message: 'O valor unitário deve ser maior que zero' })
  @IsOptional()
  unitPrice?: number;

  /**
   * Nome do solicitante, departamento ou destinatário responsável pelo recebimento ou retirada.
   */
  @IsString({ message: 'O campo solicitante deve ser uma string' })
  @IsOptional()
  requester?: string;

  /**
   * Justificativa, observações, referência de nota fiscal ou informações complementares.
   */
  @IsString({ message: 'O campo descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  /**
   * Identificador do usuário que está registrando a movimentação no sistema.
   * Se omitido, será extraído com segurança do token JWT da sessão.
   */
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  @IsOptional()
  userId?: number;

  /**
   * Identificador do produto que sofrerá a alteração de estoque.
   */
  @IsInt({ message: 'O ID do produto deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório' })
  productId: number;
}