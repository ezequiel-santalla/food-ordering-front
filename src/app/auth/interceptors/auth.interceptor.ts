import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, EMPTY, from, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap } from 'rxjs/operators';

import { AuthStateManager } from '../services/auth-state-manager.service';
import { AuthService } from '../services/auth.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { TableSessionService } from '../../store-front/services/table-session.service';
import { JwtUtils } from '../../utils/jwt-utils';

/** ====== Context flags para requests especiales ====== */
export const SKIP_GLOBAL_401 = new HttpContextToken<boolean>(() => false);
// No adjuntar token si es invitado (para scan QR)
export const ALLOW_GUEST_NO_TOKEN = new HttpContextToken<boolean>(() => false);
// Deshabilitar refresh proactivo en una request puntual (si lo necesitaras)
export const DISABLE_PROACTIVE_REFRESH = new HttpContextToken<boolean>(() => false);

/** ====== Interceptor ====== */
let refreshInFlight$: Observable<string> | null = null;

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const authState = inject(AuthStateManager);
  const authService = inject(AuthService);
  const sweetAlertService = inject(SweetAlertService);
  const tableSessionService = inject(TableSessionService);

  const isPublic = isPublicRoute(req.url);
  const isRefresh = isRefreshRoute(req.url);
  const isScanQr = isScanQrRoute(req.url);

  const skipGlobal401 = req.context.get(SKIP_GLOBAL_401);
  const allowGuestNoToken = req.context.get(ALLOW_GUEST_NO_TOKEN);
  const disableProactiveRefresh = req.context.get(DISABLE_PROACTIVE_REFRESH);

  const token = authState.accessToken();

  // 0) Rutas públicas -> siguen sin token ni manejo
  if (isPublic) return next(req);

  // 1) Invitado escaneando QR: NO adjuntar token (para crear/migrar sesión correctamente)
  const shouldOmitToken =
    isScanQr && authState.isGuest() && allowGuestNoToken;

  const withAuth = (tok?: string) =>
    tok
      ? req.clone({
          headers: req.headers.set('Authorization', `Bearer ${tok}`),
        })
      : req;

  // 2) Adjuntar token si corresponde (no lo adjuntamos si invitado & QR & flag)
  const initialReq = shouldOmitToken ? req : withAuth(token ?? undefined);

  // 3) Refresh proactivo (solo usuarios autenticados, no refresh endpoint, ni petición marcada para deshabilitar)
  const needsProactiveRefresh =
    !!token &&
    !authState.isGuest() &&
    !isRefresh &&
    !disableProactiveRefresh &&
    willExpireSoon(token, 60_000) && // 60s
    !authState.isHandlingAuthError;

  const runWithMaybeRefresh$ = needsProactiveRefresh
    ? ensureValidAccessToken(authService, authState).pipe(
        switchMap((newAccessToken) => next(withAuth(newAccessToken)))
      )
    : next(initialReq);

  // 4) Manejo de 401 sólo si NO está marcado SKIP_GLOBAL_401.
  return runWithMaybeRefresh$.pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el refresh falló o cayó un 401 en el endpoint de refresh, terminar sesión
      if (isRefresh) {
        authService.logout?.();
        return throwError(() => error);
      }

      // Importante: para /scan-qr (o requests marcadas), los errores deben
      // propagarse al caller (TableSessionService) para mostrar mensajes específicos.
      if (skipGlobal401) {
        return throwError(() => error);
      }

      if (error.status !== 401) {
        // Errores no-auth tal cual
        return throwError(() => error);
      }

      // Si ya estamos manejando auth, evitar loops
      if (authState.isHandlingAuthError) {
        return throwError(() => new Error('AuthFlowInProgress'));
      }

      authState.isHandlingAuthError = true;

      // Invitado: sesión de invitado expirada → alerta y limpieza de sesión invitado.
      if (authState.isGuest()) {
        const alertPromise = sweetAlertService.showError(
          'Sesión Expirada',
          'Tu sesión de invitado ha terminado. Registrate para mejorar tu experiencia.'
        );

        return from(alertPromise).pipe(
          switchMap(() => {
            tableSessionService.leaveSession();
            return throwError(() => new Error('GuestSessionExpired'));
          }),
          finalize(() => {
            authState.isHandlingAuthError = false;
          })
        );
      }

      // Usuario autenticado: intentar refresh y reintentar request
      return ensureValidAccessToken(authService, authState).pipe(
        switchMap((newAccessToken) => {
          const retried = withAuth(newAccessToken);
          return next(retried);
        }),
        catchError((refreshError) => {
          // Falló el refresh -> cerrar sesión de cliente
          authService.logout?.();
          return throwError(() => refreshError);
        }),
        finalize(() => {
          authState.isHandlingAuthError = false;
        })
      );
    })
  );
}

/** ====== Helpers ====== */
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

function isRefreshRoute(url: string): boolean {
  return url.includes('/auth/refresh') || url.includes('/refresh-token');
}

function willExpireSoon(jwt: string, msBefore: number): boolean {
  try {
    const decoded = JwtUtils.decodeJWT(jwt);
    const expMs = (decoded?.exp ?? 0) * 1000;
    return expMs - Date.now() < msBefore;
  } catch {
    // Si no se puede decodificar, forzamos refresh preventivo
    return true;
  }
}

function ensureValidAccessToken(
  authService: AuthService,
  authState: AuthStateManager
): Observable<string> {
  if (refreshInFlight$) return refreshInFlight$;

  refreshInFlight$ = authService.refreshAccessToken().pipe(
    shareReplay(1),
    finalize(() => {
      refreshInFlight$ = null;
    })
  );

  return refreshInFlight$;
}

/*
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateManager } from '../services/auth-state-manager.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, EMPTY, from, switchMap, throwError } from 'rxjs';
import { TableSessionService } from '../../store-front/services/table-session.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  const authState = inject(AuthStateManager);
  const authService = inject(AuthService);
  const tableSessionService = inject(TableSessionService);
  const sweetAlertService = inject(SweetAlertService);

  if (isPublicRoute(req.url)) {
    return next(req);
  }

  const token = authState.accessToken();

  if (!token) {
    return next(req);
  }

  // Caso especial: Scan QR como invitado
  // Si es un invitado escaneando QR, NO enviar token para crear nueva sesión
  // Si es un usuario autenticado, SÍ enviar token para preservar su identidad
  if (isScanQrRoute(req.url) && authState.isGuest()) {
    return next(req);
  }

  // Clona la petición y agrega el header de autorización
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && req.url.includes('/auth/login')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        if (authState.isHandlingAuthError) {
          return EMPTY;
        }

        authState.isHandlingAuthError = true;

        if (authState.isGuest()) {
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
          console.warn('🚫 Token de Cliente expirado. Iniciando refresco...');

          return authService.refreshAccessToken().pipe(
            switchMap((newAccessToken: string) => {
              console.log(
                '✅ Token refrescado, reintentando petición original...'
              );
              const requestWithNewToken = req.clone({
                headers: req.headers.set(
                  'Authorization',
                  `Bearer ${newAccessToken}`
                ),
              });
              return next(requestWithNewToken);
            }),
            catchError((refreshError) => {
              console.error('Falló el refresh token, la sesión se cerró.');
              return EMPTY;
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
}

function isPublicRoute(url: string): boolean {
  const publicRoutes = [
    //Por el momento se deja incluido el token en el login
    // ya que es como se identifica una sesion de invitado previa para migrar
    // '/auth/login',      Login de usuarios
    '/auth/register', // Registro de nuevos usuarios
    '/auth/forgot-password',
    '/auth/reset-password',
    '/public/', // Cualquier endpoint bajo /public/
  ];

  return publicRoutes.some((route) => url.includes(route));
}

function isScanQrRoute(url: string): boolean {
  return url.includes('/scan-qr');
}
*/

/*
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateManager } from '../services/auth-state-manager.service';
import { AuthService } from '../services/auth.service';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { TableSessionService } from '../../store-front/services/table-session.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { JwtUtils } from '../../utils/jwt-utils';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const authState = inject(AuthStateManager);
  const authService = inject(AuthService);
  const tableSessionService = inject(TableSessionService);
  const sweetAlertService = inject(SweetAlertService);

  const token = authState.accessToken();
  // Rutas públicas: no se interceptan
  if (isPublicRoute(req.url)) return next(req);

  // Invitado escaneando QR: no se envía token
  if (isScanQrRoute(req.url) && authState.isGuest()) return next(req);
  // Adjunta token en todos los casos, incluso refresh
  const authReq = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      })
    : req;

  // --- REFRESH PROACTIVO ---
  let refreshNeeded = false;
  if (token && !authState.isGuest() && !isRefreshRoute(req.url)) {
    try {
      const decoded = JwtUtils.decodeJWT(token);
      const expires = decoded.exp * 1000;
      const now = Date.now();
      if (expires - now < 60_000 && !authState.isHandlingAuthError) {
        refreshNeeded = true;
      }
    } catch (e) {
      console.error('Error decodificando token para refresh proactivo', e);
    }
  }
  let stream$: Observable<HttpEvent<any>>;

  if (refreshNeeded) {
    console.warn('⚠️ Token a punto de expirar, refrescando proactivamente...');
    authState.isHandlingAuthError = true;
    stream$ = authService.refreshAccessToken().pipe(
      switchMap((newAccessToken: string) => {
        authState.isHandlingAuthError = false;
        console.log('✅ Refresh proactivo OK. Enviando petición original.');
        const retriedReq = authReq.clone({
          headers: authReq.headers.set(
            'Authorization',
            `Bearer ${newAccessToken}`
          ),
        });
        return next(retriedReq);
      }),
      catchError((err) => {
        authState.isHandlingAuthError = false;
        console.error('❌ Refresh proactivo falló', err);
        authService.logout?.();
        return throwError(() => err);
      })
    );
  } else {
    stream$ = next(authReq);
  }

  // --- MANEJO DE 401 ---
  return stream$.pipe(
    catchError((error: HttpErrorResponse) => {
      if (isRefreshRoute(req.url)) {
        console.error('401 en refresh, cerrando sesión.');
        authService.logout?.();
        return throwError(() => error);
      }
      if (authState.isHandlingAuthError) {
        return throwError(() => new Error('AuthFlowInProgress'));
      }

      authState.isHandlingAuthError = true;
      // Invitado
      if (authState.isGuest()) {
        console.warn('🚫 Token de Invitado expirado.');
        const alertPromise = sweetAlertService.showError(
          'Sesión Expirada',
          'Tu sesión de invitado ha terminado. Registrate para mejorar tu experiencia.'
        );

        return from(alertPromise).pipe(
          switchMap(() => {
            tableSessionService.leaveSession();
            authState.isHandlingAuthError = false;
            return throwError(() => new Error('GuestSessionExpired'));
          })
        );
      }
      // Cliente autenticado
      console.warn('🚫 Token expirado. Intentando refresh...');
      return authService.refreshAccessToken().pipe(
        switchMap((newAccessToken: string) => {
          console.log('✅ Token refrescado, reintentando...');
          const retriedReq = authReq.clone({
            headers: authReq.headers.set(
              'Authorization',
              `Bearer ${newAccessToken}`
            ),
          });
          authState.isHandlingAuthError = false;
          return next(retriedReq);
        }),
        catchError((refreshError) => {
          console.error('❌ Falló el refresh, cerrando sesión.');
          authState.isHandlingAuthError = false;
          authService.logout?.();
          return throwError(() => refreshError);
        })
      );
    })
  );
}

function isPublicRoute(url: string): boolean {
  const publicRoutes = [
    //Por el momento se deja incluido el token en el login
    // ya que es como se identifica una sesion de invitado previa para migrar
    // '/auth/login',      Login de usuarios
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

function isRefreshRoute(url: string): boolean {
  return url.includes('/auth/refresh') || url.includes('/refresh-token');
}
*/