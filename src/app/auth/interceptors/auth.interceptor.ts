// auth/interceptors/auth.interceptor.ts
import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Rutas públicas que NO necesitan token
  const publicRoutes = [
    '/auth/',
    '/table-sessions/scan-qr',
    '/public/'
  ];

  // Verificar si la URL coincide con alguna ruta pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Si es ruta pública, no agregar token
  if (isPublicRoute) {
    return next(req);
  }

  // Para rutas protegidas, agregar token si existe
  const token = inject(AuthService).accessToken();

  if (!token) {
    return next(req);
  }

  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${token}`),
  });

  return next(newReq);
}
