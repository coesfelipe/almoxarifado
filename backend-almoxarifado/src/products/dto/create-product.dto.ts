import { IsNotEmpty, IsNumber, IsString, IsPositive, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para cadastro de um novo produto no estoque do almoxarifado.
 * Garante que todos os campos obrigatórios sejam validados e convertidos corretamente.
 */
export class CreateProductDto {
  /**
   * Nome ou descrição do produto (ex: 'Papel Sulfite A4 75g', 'Cabo de Rede Cat6').
   */
  @IsString({ message: 'O nome do produto deve ser texto' })
  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  name: string;

  /**
   * Valor unitário de referência do produto em reais (R$).
   * Deve ser um número estritamente positivo (> 0).
   */
  @Type(() => Number)
  @IsNumber({}, { message: 'O preço deve ser um valor numérico válido' })
  @IsPositive({ message: 'O preço unitário deve ser maior que zero' })
  price: number;

  /**
   * Categoria mercadológica ou grupo funcional do item (ex: 'Informática', 'Limpeza', 'Escritório').
   */
  @IsString({ message: 'A categoria deve ser texto' })
  @IsNotEmpty({ message: 'A categoria do produto é obrigatória' })
  category: string;

  /**
   * Unidade de medida padrão para contagem física (ex: 'UN', 'CX', 'KG', 'L', 'PCT').
   */
  @IsString({ message: 'A unidade de medida deve ser texto' })
  @IsNotEmpty({ message: 'A unidade de medida é obrigatória' })
  measurement: string;

  /**
   * Saldo inicial de estoque no ato do cadastro.
   * Opcional: Se informado e for maior que zero, gera automaticamente uma movimentação de ENTRADA.
   */
  @Type(() => Number)
  @IsInt({ message: 'O estoque inicial deve ser um número inteiro' })
  @Min(0, { message: 'O estoque inicial não pode ser negativo' })
  @IsOptional()
  currentStock?: number;
}