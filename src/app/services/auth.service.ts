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

  // ✅ Mapa de rutas y permisos requeridos
  private routePermissions: { [key: string]: string[] } = {
    '/dashboard': ['dashboard.ver'],
    '/buscar-cliente': ['clientes.leer', 'clientes.buscar_avanzado'],
    '/agregar-cliente': ['clientes.crear'],
    '/morosos': ['morosos.ver', 'morosos.filtrar', 'morosos.exportar', 'morosos.gestionar'],
    '/agregar-pago': ['pagos.crear', 'pagos.leer'],
    '/crear-usuario': ['usuarios.crear'],
    '/planes': ['planes.leer'],
    '/sectores': ['sectores.leer'],
    '/tarifas': ['tarifas.leer'],
    '/tipos-servicio': ['tipos_servicio.leer'],
    '/estados': ['estados.leer'],
    '/permisos': ['permisos.leer'],
    '/bitacora': ['bitacora.leer']
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(user: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { user, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            console.log('✅ Login exitoso, guardando token y usuario');
            console.log('   Usuario:', response.user.nombre);
            console.log('   Permisos recibidos:', response.user.permisos);
            console.log('   Total permisos:', response.user.permisos?.length || 0);
            
            this.saveToken(response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('currentUser');
    
    if (!token || !userStr) {
      console.log('⚠️ No hay token o usuario en localStorage');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('✅ Usuario cargado desde localStorage:', user.nombre);
      console.log('   Permisos cargados:', user.permisos);
      console.log('   Total permisos:', user.permisos ? user.permisos.length : 0);
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('❌ Error al parsear usuario desde localStorage:', error);
      this.logout();
    }
  }

  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    let user = this.currentUserSubject.value;
    
    if (!user) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        try {
          user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('❌ Error al parsear usuario:', error);
        }
      }
    }
    
    return user;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    
    if (!user) {
      console.log(`❌ hasPermission("${permission}"): No hay usuario`);
      return false;
    }
    
    if (!user.permisos || !Array.isArray(user.permisos)) {
      console.log(`❌ hasPermission("${permission}"): Usuario sin permisos válidos`, user.permisos);
      return false;
    }
    
    const hasIt = user.permisos.includes(permission);
    console.log(`🔐 hasPermission("${permission}"):`, hasIt ? '✅ SI' : '❌ NO');
    
    return hasIt;
  }

  hasAnyPermission(permissions: string[]): boolean {
    const user = this.getCurrentUser();
    
    if (!user) {
      console.log(`❌ hasAnyPermission([${permissions.join(', ')}]): No hay usuario`);
      return false;
    }
    
    if (!user.permisos || !Array.isArray(user.permisos)) {
      console.log(`❌ hasAnyPermission([${permissions.join(', ')}]): Usuario sin permisos válidos`, user.permisos);
      return false;
    }
    
    const hasAny = permissions.some(p => user.permisos!.includes(p));
    console.log(`🔐 hasAnyPermission([${permissions.join(', ')}]):`, hasAny ? '✅ SI' : '❌ NO');
    console.log(`   Permisos del usuario:`, user.permisos);
    
    return hasAny;
  }

  hasAllPermissions(permissions: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permisos) {
      return false;
    }
    return permissions.every(p => user.permisos!.includes(p));
  }

  getUserPermissions(): string[] {
    const user = this.getCurrentUser();
    const permisos = user?.permisos || [];
    console.log('📋 getUserPermissions():', permisos);
    return permisos;
  }

  getFirstAvailableRoute(): string {
    const userPerms = this.getUserPermissions();
    
    console.log('🔍 Buscando primera ruta disponible...');
    console.log('   Permisos del usuario:', userPerms);
    
    const routePriority = [
      '/dashboard',
      '/buscar-cliente',
      '/agregar-cliente',
      '/agregar-pago',
      '/crear-usuario',
      '/morosos',
      '/planes',
      '/sectores',
      '/tarifas',
      '/tipos-servicio',
      '/estados',
      '/permisos',
      '/bitacora'
    ];
    
    for (const route of routePriority) {
      const requiredPerms = this.routePermissions[route];
      if (requiredPerms && requiredPerms.some(p => userPerms.includes(p))) {
        console.log(`✅ Primera ruta disponible: ${route}`);
        return route;
      }
    }
    
    console.log('⚠️ No se encontró ninguna ruta disponible');
    return '/login';
  }

  logout(): void {
    console.log('🚪 Cerrando sesión...');
    
    // ✅ Llamar al backend para registrar el logout en la bitácora
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: (response) => {
          console.log('✅ Logout registrado en el servidor');
        },
        error: (error) => {
          console.error('⚠️ Error al registrar logout en el servidor:', error);
          // Continuar con el logout local incluso si falla el registro
        }
      });
    }
    
    // Limpiar datos locales
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}