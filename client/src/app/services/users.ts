import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserRole } from './auth';

/**
 * Interface que representa um usuário cadastrado no sistema retornado pela API.
 */
export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  movementsCount?: number;
}

/**
 * Payload para criação de nova conta de usuário pelo Administrador.
 */
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Payload para atualização de conta de usuário pelo Administrador.
 */
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

/**
 * Serviço Angular responsável pelas operações de gestão e administração de usuários.
 * Todas as rotas de API exigem token JWT com papel ADMIN.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  /**
   * Obtém a lista completa de usuários cadastrados no almoxarifado.
   */
  getUsers(): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(this.apiUrl);
  }

  /**
   * Obtém os detalhes de um único usuário por ID.
   */
  getUserById(id: number): Observable<UserItem> {
    return this.http.get<UserItem>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cadastra uma nova conta de usuário definindo seu papel (ADMIN ou USER).
   */
  createUser(payload: CreateUserPayload): Observable<UserItem> {
    return this.http.post<UserItem>(this.apiUrl, payload);
  }

  /**
   * Atualiza dados cadastrais, papel ou senha de um usuário existente.
   */
  updateUser(id: number, payload: UpdateUserPayload): Observable<UserItem> {
    return this.http.put<UserItem>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Exclui permanentemente uma conta de usuário do sistema.
   */
  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

