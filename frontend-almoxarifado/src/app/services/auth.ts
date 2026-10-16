import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailDto {
  newEmail: string;
  passwordPlain: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private apiUrl = `${environment.apiUrl}`;
  private loginUrl = `${this.apiUrl}/auth/login`;
  private registerUrl = `${this.apiUrl}/auth/register`;
  private profileUrl = `${this.apiUrl}/auth/profile`;
  private changePasswordUrl = `${this.apiUrl}/auth/change-password`;
  private changeEmailUrl = `${this.apiUrl}/auth/change-email`;

  login(dados: { email: string; senha: string }) {
    const body = { email: dados.email, password: dados.senha };
    return this.http.post<{ access_token: string; user?: UserProfile }>(this.loginUrl, body).pipe(
      tap(res => {
        if (this.isBrowser) {
          localStorage.setItem('token', res.access_token);
          if (res.user?.role) {
            localStorage.setItem('userRole', res.user.role);
          }
          if (res.user?.id) {
            localStorage.setItem('userId', res.user.id.toString());
          }
        }
      })
    );
  }

  register(dados: { username: string; email: string; senha: string; role?: UserRole }) {
    const body = { username: dados.username, email: dados.email, password: dados.senha, role: dados.role };
    return this.http.post<{ id: number; email: string; username: string; role: UserRole }>(this.registerUrl, body);
  }

  profile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.profileUrl).pipe(
      tap(u => {
        if (this.isBrowser && u.role) {
          localStorage.setItem('userRole', u.role);
        }
      })
    );
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
  }

  changePassword(data: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(this.changePasswordUrl, data);
  }

  changeEmail(data: ChangeEmailDto): Observable<{ message: string; email: string }> {
    return this.http.patch<{ message: string; email: string }>(this.changeEmailUrl, data);
  }

  get token(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  get userRole(): UserRole {
    if (!this.isBrowser) return 'USER';
    const storedRole = localStorage.getItem('userRole') as UserRole;
    if (storedRole === 'ADMIN' || storedRole === 'USER') {
      return storedRole;
    }
    const token = this.token;
    if (!token) return 'USER';
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return (payload.role as UserRole) || 'USER';
    } catch {
      return 'USER';
    }
  }

  get isAdmin(): boolean {
    return this.logado && this.userRole === 'ADMIN';
  }

  get logado(): boolean {
    const token = this.token;
    if (!token) return false;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}