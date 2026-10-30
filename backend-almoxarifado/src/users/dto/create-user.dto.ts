import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

/**
 * DTO para criação de uma nova conta de usuário por um Administrador.
 */
export class CreateUserDto {
  /**
   * Nome completo ou de exibição do usuário.
   */
  @IsString({ message: 'O nome do usuário deve ser um texto válido' })
  @IsNotEmpty({ message: 'O nome do usuário é obrigatório' })
  name: string;

  /**
   * Endereço de e-mail institucional do usuário.
   */
  @IsEmail({}, { message: 'Por favor, informe um endereço de e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  /**
   * Senha de acesso inicial para a conta (mínimo de 6 caracteres).
   */
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve conter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;

  /**
   * Nível de permissão atribuído à conta (ADMIN ou USER).
   * Padrão: USER.
   */
  @IsEnum(UserRole, { message: 'O papel deve ser ADMIN ou USER' })
  @IsOptional()
  role?: UserRole;
}

