// shared/services/error-handler.service.ts
import { Injectable } from '@angular/core';

export interface ErrorMessage {
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {

  /**
   * Obtiene mensaje de error para autenticación
   */
  getAuthError(error: any): ErrorMessage {
    switch (error.status) {
      case 401:
        return {
          title: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos. Por favor, verifica tus datos.'
        };
      case 404:
        return {
          title: 'Usuario no encontrado',
          message: 'No existe una cuenta asociada a este email.'
        };
      case 403:
        return {
          title: 'Acceso denegado',
          message: 'Tu cuenta podría estar bloqueada o inactiva.'
        };
      case 0:
        return {
          title: 'Sin conexión',
          message: 'No se puede conectar al servidor. Verifica tu conexión a internet.'
        };
      default:
        if (error.status >= 500) {
          return {
            title: 'Error del servidor',
            message: 'Error interno del servidor. Intenta más tarde.'
          };
        }
        return {
          title: 'Error al iniciar sesión',
          message: 'No se pudo iniciar sesión. Verifica tus credenciales.'
        };
    }
  }

  /**
   * Obtiene mensaje de error para escaneo de QR
   */
  getQrScanError(error: any): ErrorMessage {
    switch (error.status) {
      case 400:
        return {
          title: 'QR inválido',
          message: 'El código QR no es válido o ya tienes una sesión activa.'
        };
      case 404:
        return {
          title: 'Mesa no encontrada',
          message: 'No existe una mesa con ese código.'
        };
      case 409:
        return {
          title: 'Sesión existente',
          message: 'Ya tienes una sesión activa en otra mesa.'
        };
      case 0:
        return {
          title: 'Sin conexión',
          message: 'No se puede conectar al servidor. Verifica tu conexión a internet.'
        };
      default:
        if (error.status >= 500) {
          return {
            title: 'Error del servidor',
            message: 'Error interno del servidor. Intenta más tarde.'
          };
        }
        return {
          title: 'Error al conectar',
          message: 'No se pudo conectar con la mesa. Intenta nuevamente.'
        };
    }
  }

  /**
   * Método genérico para cualquier error HTTP
   */
  getGenericError(error: any, context: string = 'operación'): ErrorMessage {
    if (error.status === 0) {
      return {
        title: 'Sin conexión',
        message: 'No se puede conectar al servidor. Verifica tu conexión a internet.'
      };
    }

    if (error.status >= 500) {
      return {
        title: 'Error del servidor',
        message: 'Error interno del servidor. Intenta más tarde.'
      };
    }

    return {
      title: 'Error',
      message: `Error al realizar ${context}. Intenta nuevamente.`
    };
  }
}
