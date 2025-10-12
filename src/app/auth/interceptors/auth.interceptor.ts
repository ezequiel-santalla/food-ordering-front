import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Rutas públicas que NO necesitan token NUNCA
  const alwaysPublicRoutes = ['/auth/login', '/auth/register', '/public/'];

  // Verificar si la URL coincide con rutas siempre públicas
  const isAlwaysPublic = alwaysPublicRoutes.some(route => req.url.includes(route));

  if (isAlwaysPublic) {
    console.log('🌐 Ruta pública (siempre), sin token:', req.url);
    return next(req);
  }

  // Para scan-qr: agregar token SOLO si está autenticado
  const isScanQr = req.url.includes('/scan-qr');

  const authService = inject(AuthService);
  const token = authService.accessToken();
  const refreshToken = authService.refreshToken();

  // Si es scan-qr y NO está autenticado (no tiene refreshToken válido)
  if (isScanQr && (!refreshToken || refreshToken === 'guest')) {
    console.log('📱 Scan QR sin autenticación (invitado), sin token');
    return next(req);
  }

  // Si es scan-qr y SÍ está autenticado
  if (isScanQr && refreshToken && refreshToken !== 'guest') {
    console.log('📱 Scan QR con autenticación (usuario logueado), agregando token');
  }

  // Para todas las demás rutas protegidas
  if (!token) {
    console.warn('⚠️ No hay token disponible para:', req.url);
    return next(req);
  }

  console.log('🔐 Agregando token a la petición:', req.url);
  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${token}`),
  });

  return next(newReq);
}
