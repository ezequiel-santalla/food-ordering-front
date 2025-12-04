import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth-service';
import { QrProcessingService } from '../services/qr-processing-service';

export const UnauthenticatedGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  console.log('🛡️ UnauthenticatedGuard | URL solicitada:', state.url);

  const authService = inject(AuthService);
  const router = inject(Router);
  const qrFlow = inject(QrProcessingService);

  const isPublicAuthFlow =
    state.url.includes('/forgot-password') ||
    state.url.includes('/reset-password') ||
    state.url.includes('/verify-email') ||
    state.url.includes('/resend-verification');

  if (isPublicAuthFlow) {
    return true;
  }

  if (qrFlow.isInQrFlow()) {
    console.log('Permitiendo login porque viene del flujo QR');
    return true;
  }

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return true;
  }

  if (authService.isGuest()) {
    return true;
  }

  const tableSessionId = authService.tableSessionId();

  if (tableSessionId) {
    router.navigate(['/']);
    return false;
  }

  router.navigate(['/scan-qr']);
  return false;
};
