import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/entities/user.entity.js';
import { ROLES_KEY } from './roles.decorator.js';

/**
 * Guard de Autorização por Papel (RBAC - Role-Based Access Control).
 * Intercepta a requisição após a autenticação JWT e valida se o usuário possui
 * pelo menos uma das roles exigidas para a rota.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se nenhuma role específica foi exigida na rota, o acesso é liberado para qualquer autenticado
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Se o usuário não existir na requisição ou não possuir role
    if (!user || !user.role) {
      throw new ForbiddenException('Acesso negado: Perfil do usuário não identificado.');
    }

    // Verifica se a role do usuário corresponde a uma das permitidas
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado: Esta operação requer privilégios de [${requiredRoles.join(', ')}]. Seu perfil atual é [${user.role}].`,
      );
    }

    return true;
  }
}

