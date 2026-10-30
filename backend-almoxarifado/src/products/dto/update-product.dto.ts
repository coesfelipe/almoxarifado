import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto.js';

/**
 * DTO para atualização parcial de dados cadastrais de um produto existente.
 * Herda todos os campos e regras de validação de `CreateProductDto`, tornando todos os campos opcionais.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}