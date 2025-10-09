// auth/interceptors/auth.interceptor.ts
import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Rutas públicas que NO necesitan token
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/public/'
  ];

  // Verificar si la URL coincide con alguna ruta pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Si es ruta pública, no agregar token
  if (isPublicRoute) {
    console.log('🌐 Ruta pública detectada, sin token:', req.url);
    return next(req);
  }

  // Para rutas protegidas, agregar token si existe
  const authService = inject(AuthService);
  const token = authService.accessToken();

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
