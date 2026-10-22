import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSectorDto {
  @IsString({ message: 'O nome do setor deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do setor é obrigatório' })
  name: string;

  @IsString({ message: 'A descrição do setor deve ser um texto' })
  @IsOptional()
  description?: string;
}
