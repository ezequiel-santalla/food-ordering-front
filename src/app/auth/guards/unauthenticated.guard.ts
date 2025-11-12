import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth-service';

export const UnauthenticatedGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  console.log('🛡️ UnauthenticatedGuard | URL solicitada:', state.url);

  const authService = inject(AuthService);
  const router = inject(Router);

  const isPasswordResetFlow =
    state.url.includes('/forgot-password') ||
    state.url.includes('/reset-password');

  if (isPasswordResetFlow) {
    return true;
  }

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    console.log('✅ No autenticado, puede acceder a login');
    return true;
  }

  const isGuest = authService.isGuest();

  if (isGuest) {
    console.log('👻 Guest detectado, permitiendo acceso a login');
    return true;
  }

  console.log('✅ Ya autenticado, verificando sesión de mesa...');

  const tableSessionId = authService.tableSessionId();

  if (
    tableSessionId &&
    tableSessionId !== 'undefined' &&
    tableSessionId !== 'null'
  ) {
    console.log('✅ Con sesión de mesa, redirigiendo a home');
    router.navigate(['/']);
  } else {
    console.log('⚠️ Sin sesión de mesa, redirigiendo a scan-qr');
    router.navigate(['/scan-qr']);
  }

  return false;
};
