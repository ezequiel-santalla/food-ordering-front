import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateManager } from '../services/auth-state-manager-service';
import { AuthService } from '../services/auth-service';
import { catchError, EMPTY, from, switchMap, throwError } from 'rxjs';
import { TableSessionService } from '../../store-front/services/table-session-service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { JwtUtils } from '../../utils/jwt-utils';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  const authState = inject(AuthStateManager);
  const authService = inject(AuthService);
  const tableSessionService = inject(TableSessionService);
  const sweetAlertService = inject(SweetAlertService);

  // 1. Verificar si es una ruta pública (no requiere autenticación)
  if (isPublicRoute(req.url)) {
    return next(req);
  }

  // 2. Verificar si es una ruta que NO debe hacer refresh automático
  if (isExcludedFromRefresh(req.url)) {
    const token = authState.accessToken();
    if (!token) {
      return next(req);
    }

    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(authReq);
  }

  // 3. Obtener el token de acceso desde el estado
  const token = authState.accessToken();

  // 4. Si no hay token disponible, continuar sin autorización
  if (!token) {
    return next(req);
  }

  // 5. Caso especial: Scan QR como invitado
  if (isScanQrRoute(req.url) && authState.isGuest()) {
    return next(req);
  }

  // 6. NUEVO: Verificar si el token expira pronto (menos de 1 minuto)
  //    Solo para clientes autenticados (no invitados)
  if (!authState.isGuest() && willExpireSoon(token, 60 * 1000)) {
    console.warn('⏰ Token expira pronto, refrescando proactivamente...');

    return authService.refreshAccessToken().pipe(
      switchMap((newAccessToken: string) => {
        console.log('✅ Token refrescado proactivamente, enviando petición...');
        const requestWithNewToken = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`),
        });
        return next(requestWithNewToken);
      }),
      catchError(() => {
        console.error('❌ Falló el refresh proactivo, intentando con token actual...');
        // Si falla el refresh, intentamos con el token actual de todos modos
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        return next(authReq);
      })
    );
  }

  // 7. Clonar la petición y agregar el header de autorización
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  // 8. LÓGICA DE MANEJO DE ERRORES (COMPLETA)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // CASO 0: Ignorar 401 en /login
      if (error.status === 401 && req.url.includes('/auth/login')) {
        return throwError(() => error);
      }

      // CASO 1: Es un error 401 en cualquier otra ruta
      if (error.status === 401) {

        if (authState.isHandlingAuthError) {
          return EMPTY;
        }

        // Si somos la PRIMERA petición en fallar, levantamos el flag.
        authState.isHandlingAuthError = true;

        if (authState.isGuest()) {
          // --- LÓGICA PARA INVITADOS (CON AVISO) ---
          console.warn('🚫 Token de Invitado expirado. Mostrando aviso...');

          const alertPromise = sweetAlertService.showError(
            'Sesión Expirada',
            'Tu sesión de invitado ha terminado. Registrate para mejorar tu experiencia'
          );

          return from(alertPromise).pipe(
            switchMap(() => {
              tableSessionService.leaveSession();
              return EMPTY;
            })
          );

        } else {
          // --- LÓGICA PARA CLIENTES (CON REFRESH TOKEN) ---
          console.warn('🚫 Token de Cliente expirado. Iniciando refresco...');

          return authService.refreshAccessToken().pipe(
            switchMap((newAccessToken: string) => {
              console.log('✅ Token refrescado, reintentando petición original...');
              const requestWithNewToken = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`),
              });
              return next(requestWithNewToken);
            }),
            catchError(() => {
              console.error('Falló el refresh token, la sesión se cerró.');
              return EMPTY;
            })
          );
        }
      }

      // Si no es 401, simplemente relanza el error
      return throwError(() => error);
    })
  );
}

function isPublicRoute(url: string): boolean {
  const publicRoutes = [
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/public/',
  ];

  return publicRoutes.some((route) => url.includes(route));
}

function isScanQrRoute(url: string): boolean {
  return url.includes('/scan-qr');
}

function isExcludedFromRefresh(url: string): boolean {
  const excludedRoutes = [
    '/auth/refresh',    // No refrescar cuando estamos refrescando
    '/auth/logout',     // No refrescar cuando estamos cerrando sesión
    '/auth/login',      // No refrescar en login
  ];

  return excludedRoutes.some((route) => url.includes(route));
}

function willExpireSoon(jwt: string, msBefore: number): boolean {
  try {
    const decoded = JwtUtils.decodeJWT(jwt);

    if (!decoded.exp) {
      return true;
    }

    const expirationTime = decoded.exp * 1000;
    const warningTime = expirationTime - msBefore;

    return Date.now() >= warningTime;
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return true;
  }
}
