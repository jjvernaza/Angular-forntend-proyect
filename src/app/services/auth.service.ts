// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface User {
  id: number;
  nombre: string;
  apellidos?: string;
  funcion?: string;
  permisos?: string[];
}

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar si hay un token guardado e intentar cargar el usuario
    const token = this.getToken();
    if (token) {
      this.loadUserFromToken();
    }
  }

  login(user: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { user, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            this.saveToken(response.token);
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  private loadUserFromToken(): void {
    // Comprobar si el token es válido
    this.http.get<{message: string, user: User}>(`${this.apiUrl}/verify-token`)
      .subscribe(
        (response) => {
          if (response && response.user) {
            this.currentUserSubject.next(response.user);
          } else {
            this.logout();
          }
        },
        () => {
          // Si hay error, el token no es válido
          this.logout();
        }
      );
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Verificar si el usuario tiene un permiso específico
  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.permisos) {
      return false;
    }
    return user.permisos.includes(permission);
  }

  // Verificar si el usuario tiene alguno de los permisos especificados
  hasAnyPermission(permissions: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.permisos) {
      return false;
    }
    return permissions.some(p => user.permisos!.includes(p));
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}