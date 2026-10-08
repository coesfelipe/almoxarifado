import { IsNotEmpty, IsNumber, IsString, IsPositive, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  measurement: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  currentStock?: number;
}