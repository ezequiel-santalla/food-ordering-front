import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const HasTableSessionGuard: CanActivateFn = (route, state) => {

    console.log('🛡️ HasTableSessionGuard ejecutado', {
    attemptedRoute: state.url,
    tableSessionId: inject(AuthService).tableSessionId()
  });
  
  const authService = inject(AuthService);
  const router = inject(Router);

  if (state.url.startsWith('/auth/login')) {
    return true;
  }

  const tableSessionId = authService.tableSessionId();

  console.log('🛡️ HasTableSessionGuard:', { tableSessionId });

  if (!tableSessionId || tableSessionId === 'undefined' || tableSessionId === 'null') {
    console.log('❌ No hay sesión de mesa válida, redirigiendo a /food-venues');
    router.navigate(['/food-venues'], { replaceUrl: true });
    return false;
  }

  console.log('✅ Tiene sesión de mesa activa');
  return true;
};
