import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

export const networkErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const sweetAlert = inject(SweetAlertService);

  return next(req).pipe(
    catchError((error) => {
      if (!navigator.onLine) {
        sweetAlert.showError(
          'Sin conexión',
          'Parece que no tenés internet. Revisá tu conexión.'
        );
        return throwError(() => error);
      }

      if (error.name === 'TimeoutError') {
        sweetAlert.showError(
          'Servidor lento',
          'La operación está tardando demasiado. Intentá nuevamente.'
        );
        return throwError(() => error);
      }

      if (error.status === 0 && error.message?.toLowerCase().includes('cors')) {
        sweetAlert.showError(
          'Error de servidor (CORS)',
          'La aplicación no tiene permiso para acceder al servidor.'
        );
        return throwError(() => error);
      }

      if (error.status === 0) {
        sweetAlert.showError(
          'Error de conexión',
          'No se pudo contactar con el servidor. Probablemente esté fuera de línea.'
        );
        return throwError(() => error);
      }

      if (error.status === 0 && error.url && error.url.startsWith('http')) {
        sweetAlert.showError(
          'Servidor no disponible',
          'No se pudo encontrar el servidor. Verificá la configuración.'
        );
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};
