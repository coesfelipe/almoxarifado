import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

/**
 * Guard para rotas autenticadas do sistema.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.logado ? true : router.createUrlTree(['/login']);
};

/**
 * Guard para rotas exclusivas de Administrador (ADMIN).
 * Bloqueia operadores comuns e redireciona para a página inicial.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.logado) {
    return router.createUrlTree(['/login']);
  }

  if (!auth.isAdmin) {
    alert('Acesso restrito: Esta página requer privilégios de Administrador.');
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

/**
 * Guard para rotas de convidados (Login).
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.logado ? router.createUrlTree(['/dashboard']) : true;
};