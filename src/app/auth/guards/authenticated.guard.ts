import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { firstValueFrom } from 'rxjs';

export const AuthenticatedGuard: CanActivateFn = async (route, state) => {
  console.log('🛡️ AuthenticatedGuard ejecutado', { attemptedRoute: state.url });

  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (state.url.startsWith('/auth/login') || state.url.startsWith('/auth/register')) {
    console.log('➡️ Permitido: ruta de login o registro');
    return true;
  }

  try {
    const isAuthenticated = await firstValueFrom(authService.checkAuthStatus());

    if (!isAuthenticated) {
      console.log('❌ No autenticado, redirigiendo a login');
      router.navigate(['/auth/login'], { replaceUrl: true });
      return false;
    }

    console.log('✅ Usuario autenticado');
    return true;
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    router.navigate(['/auth/login'], { replaceUrl: true });
    return false;
  }
};

