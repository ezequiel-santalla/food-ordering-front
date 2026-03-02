import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth-service';

export const RootGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const activeRole = authService.role();

  const hasRootEmployment = authService.employments().some(e => e.role === 'ROLE_ROOT');
  const isAuthenticated = authService.isAuthenticated();

  console.log('🛡️ RootGuard Check:', { 
    activeRole, 
    hasRootEmployment, 
    status: authService.authStatus() 
  });

  if (isAuthenticated && activeRole === 'ROLE_ROOT') {
    return true;
  }

  if (hasRootEmployment && activeRole !== 'ROLE_ROOT') {
    console.warn('🛡️ RootGuard: Rol ROOT no seleccionado. Redirigiendo a selección.');
    router.navigate(['/role-selection']);
    return false;
  }

  console.error('🚫 RootGuard: Acceso denegado. Sin privilegios de ROOT.');
  router.navigate(['/auth/login']);
  return false;
};