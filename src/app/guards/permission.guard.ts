// src/app/guards/permission.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermissions = route.data['permissions'] as string[];
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const hasPermission = this.authService.hasAnyPermission(requiredPermissions);
    
    if (!hasPermission) {
      console.log('❌ Acceso denegado a:', route.url);
      console.log('   Permisos requeridos:', requiredPermissions);
      console.log('   Permisos del usuario:', this.authService.getUserPermissions());
      
      // ✅ Redirigir a la primera ruta disponible en lugar de bloquear
      const firstRoute = this.authService.getFirstAvailableRoute();
      
      if (firstRoute !== '/login') {
        alert('No tienes permisos para acceder a esta sección. Serás redirigido a tu página de inicio.');
        this.router.navigate([firstRoute]);
      } else {
        alert('No tienes permisos para acceder a ninguna sección. Contacta al administrador.');
        this.authService.logout();
      }
      
      return false;
    }

    console.log('✅ Acceso concedido a la ruta');
    return true;
  }
}