import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthStateManager } from "../services/auth-state-manager.service";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authState = inject(AuthStateManager);

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
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  return next(authReq);
}

function isPublicRoute(url: string): boolean {
  const publicRoutes = [
    '/auth/login',      // Login de usuarios
    '/auth/register',   // Registro de nuevos usuarios
    '/public/'          // Cualquier endpoint bajo /public/
  ];

  return publicRoutes.some(route => url.includes(route));
}

function isScanQrRoute(url: string): boolean {
  return url.includes('/scan-qr');
}
