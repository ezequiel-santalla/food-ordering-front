import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen, timeout } from 'rxjs/operators';
import { DinnoHttpError } from '../errors/dinno-http-error';

export const httpResilienceInterceptor: HttpInterceptorFn = (req, next) => {
  const READ_TIMEOUT_MS = 12_000;
  const MAX_RETRIES = 2;
  const BASE_DELAY_MS = 600;

  if (req.url.includes('/events-subscriptions/')) {
    return next(req);
  }

  const method = req.method.toUpperCase();
  const isRead = method === 'GET' || method === 'HEAD';

  const isRetryable = (err: any) => {
    if (err?.name === 'TimeoutError') return true;
    if (err instanceof HttpErrorResponse) {
      return err.status === 0 || [502, 503, 504].includes(err.status);
    }
    return false;
  };

  const backoff = (attempt: number) => BASE_DELAY_MS * Math.pow(2, attempt - 1);

  const normalize = (err: any): DinnoHttpError => {
    if (err?.name === 'TimeoutError') {
      return new DinnoHttpError({
        kind: 'timeout',
        title: 'Servidor lento',
        message: 'El servidor no respondió a tiempo. Probá reintentar.',
        retryable: true,
        cause: err,
      });
    }

    if (err instanceof HttpErrorResponse) {
      const status = err.status;

      if (status === 0) {
        return new DinnoHttpError({
          kind: 'network',
          title: 'No se pudo conectar',
          message: 'No se pudo contactar con el servidor. Reintentá.',
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
          title: err.error?.message ? 'Credenciales inválidas' : 'Sesión vencida',
          message: err.error?.message ?? 'Tu sesión venció. Volvé a iniciar sesión.',
          retryable: false,
          status,
          appCode: err.error?.appCode,
          cause: err,
        });
      }

      const appCode = err.error?.appCode;

      return new DinnoHttpError({
        kind: 'http',
        title: 'Ocurrió un error',
        message: err.error?.message ?? `Error ${status}.`,
        retryable: false,
        status,
        appCode,
        cause: err,
      });
    }

    return new DinnoHttpError({
      kind: 'unknown',
      title: 'Error inesperado',
      message: 'Ocurrió un error inesperado. Probá reintentar.',
      retryable: true,
      cause: err,
    });
  };

  let stream$ = next(req);

  if (isRead) {
    stream$ = stream$.pipe(timeout(READ_TIMEOUT_MS));
  }

  stream$ = stream$.pipe(
    catchError((err) => throwError(() => normalize(err)))
  );

  if (isRead) {
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
