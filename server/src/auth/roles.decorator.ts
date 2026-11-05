import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity.js';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir quais papéis (Roles) têm permissão de acesso a determinada rota ou controller.
 * Exemplo de uso: @Roles(UserRole.ADMIN)
 *
 * @param roles Lista de papéis autorizados a acessar o recurso
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

