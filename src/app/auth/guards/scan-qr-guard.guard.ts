import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { SessionUtils } from '../../utils/session-utils';

export const ScanQrGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const tableSessionId = authService.tableSessionId();

  if (SessionUtils.isValidSession(tableSessionId)) {
    console.log('✅ Ya tiene sesión activa, redirigiendo al home');
    router.navigate(['/']);
    return false;
  }

  console.log('✅ Acceso permitido a scan-qr');
  return true;
};
