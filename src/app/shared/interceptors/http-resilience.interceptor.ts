import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen, timeout } from 'rxjs/operators';
import { DinnoHttpError } from '../errors/dinno-http-error';

export const httpResilienceInterceptor: HttpInterceptorFn = (req, next) => {
  const TIMEOUT_MS = 12_000;
  const MAX_RETRIES = 2;      // total: 1 intento + 2 retries = 3
  const BASE_DELAY_MS = 600;

  // Excluir SSE (aunque EventSource no pase por HttpClient, por seguridad)
  if (req.url.includes('/events-subscriptions/')) {
    return next(req);
  }

  // Retry solo para GET/HEAD (evita duplicar acciones en POST pagos/órdenes)
  const method = req.method.toUpperCase();
  const shouldRetry = method === 'GET' || method === 'HEAD';

  const isRetryable = (err: any) => {
    if (err?.name === 'TimeoutError') return true;
    if (err instanceof HttpErrorResponse) {
      return err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504;
    }
    return false;
  };

  const backoff = (attempt: number) => BASE_DELAY_MS * Math.pow(2, attempt - 1);

  const normalize = (err: any): DinnoHttpError => {
    // Timeout
    if (err?.name === 'TimeoutError') {
      return new DinnoHttpError({
        kind: 'timeout',
        title: 'Servidor lento',
        message: 'El servidor no respondió a tiempo. Probá reintentar.',
        retryable: true,
        cause: err,
      });
    }

    // HttpErrorResponse
    if (err instanceof HttpErrorResponse) {
      const status = err.status;

      // status 0 = backend caído, CORS sin éxito, sin red, etc.
      if (status === 0) {
        return new DinnoHttpError({
          kind: 'network',
          title: 'No se pudo conectar',
          message: 'No se pudo contactar con el servidor. Probablemente esté fuera de línea. Reintentá.',
          retryable: true,
          status,
          cause: err,
        });
      }

      if ([502, 503, 504].includes(status)) {
        return new DinnoHttpError({
          kind: 'server',
          title: 'Servidor no disponible',
          message: 'El servicio está con demoras o caído. Reintentá en unos segundos.',
          retryable: true,
          status,
          cause: err,
        });
      }

      if (status === 401) {
        return new DinnoHttpError({
          kind: 'auth',
          title: 'Sesión vencida',
          message: 'Tu sesión venció. Volvé a iniciar sesión.',
          retryable: false,
          status,
          cause: err,
        });
      }

      return new DinnoHttpError({
        kind: 'http',
        title: 'Ocurrió un error',
        message: err.error?.message ?? `Error ${status}.`,
        retryable: false,
        status,
        cause: err,
      });
    }

    // fallback
    return new DinnoHttpError({
      kind: 'unknown',
      title: 'Error inesperado',
      message: 'Ocurrió un error inesperado. Probá reintentar.',
      retryable: true,
      cause: err,
    });
  };

  let stream$ = next(req).pipe(
    timeout(TIMEOUT_MS),
    catchError((err) => throwError(() => normalize(err)))
  );

  if (shouldRetry) {
    stream$ = stream$.pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((err, retryIndex) => {
            const attempt = retryIndex + 1;
            if (!isRetryable((err as any).cause ?? err) || attempt > MAX_RETRIES) {
              return throwError(() => err);
            }
            return timer(backoff(attempt));
          })
        )
      )
    );
  }

  return stream$;
};