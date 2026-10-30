import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

/**
 * DTO para atualização de conta de usuário existente por um Administrador.
 */
export class UpdateUserDto {
  /**
   * Nome completo ou de exibição atualizado.
   */
  @IsString({ message: 'O nome do usuário deve ser um texto válido' })
  @IsOptional()
  name?: string;

  /**
   * Endereço de e-mail institucional atualizado.
   */
  @IsEmail({}, { message: 'Por favor, informe um endereço de e-mail válido' })
  @IsOptional()
  email?: string;

  /**
   * Nova senha (caso o administrador deseje resetar a senha da conta).
   */
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A nova senha deve conter no mínimo 6 caracteres' })
  @IsOptional()
  password?: string;

  /**
   * Papel/Nível de permissão (ADMIN ou USER).
   */
  @IsEnum(UserRole, { message: 'O papel deve ser ADMIN ou USER' })
  @IsOptional()
  role?: UserRole;
}

