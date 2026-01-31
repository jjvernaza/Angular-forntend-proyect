import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log('✅ Usuario autenticado, permitiendo acceso a:', state.url);
    return true;
  }

  console.log('❌ Usuario NO autenticado, redirigiendo a login desde:', state.url);
  router.navigate(['/login']);
  return false;
};