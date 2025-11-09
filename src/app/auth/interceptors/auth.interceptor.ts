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

  // 1. Verificar si es una ruta pública (no requiere autenticación)
  if (isPublicRoute(req.url)) {
    return next(req);
  }

  // 2. Obtener el token de acceso desde el estado
  const token = authState.accessToken();

  // 3. Si no hay token disponible, continuar sin autorización
  //    Esto permite peticiones a endpoints que no requieren auth
  if (!token) {
    return next(req);
  }

  // 4. Caso especial: Scan QR como invitado
  //    Si es un invitado escaneando QR, NO enviar token para crear nueva sesión
  //    Si es un usuario autenticado, SÍ enviar token para preservar su identidad
  if (isScanQrRoute(req.url) && authState.isGuest()) {
    return next(req);
  }

  // 5. Clonar la petición y agregar el header de autorización
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  // --- 6. LÓGICA DE MANEJO DE ERRORES (COMPLETA) ---
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

          // 1. Muestra un SweetAlert. Esto devuelve una Promesa
          const alertPromise = sweetAlertService.showError(
            'Sesión Expirada',
            'Tu sesión de invitado ha terminado. Registrate para mejorar tu experiencia'
          );

          // 2. Convertimos la promesa en un Observable
          return from(alertPromise).pipe(
            switchMap(() => {
              // 3. Cuando el usuario cierra el alert,
              //    llamamos a leaveSession() para limpiar el backend.
              //    (Esto también navega a /food-venues como vimos antes)
              tableSessionService.leaveSession();
              
              // 4. Detenemos la cadena de peticiones.
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
            catchError((refreshError) => {
              console.error('Falló el refresh token, la sesión se cerró.');
              // El authService.refreshAccessToken() ya maneja el logout y recarga
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
