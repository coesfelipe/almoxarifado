import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

/**
 * Componente reutilizável de Rodapé (Footer) institucional do sistema de Almoxarifado.
 * Exibe a identidade do sistema, links rápidos de navegação, status da aplicação e ano vigente.
 * Exibe link para Gestão de Usuários exclusivamente para administradores.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class Footer {
  private authService = inject(AuthService);
  anoAtual: number = new Date().getFullYear();

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }
}

