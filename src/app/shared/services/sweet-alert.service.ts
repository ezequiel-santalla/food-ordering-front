import { Injectable } from '@angular/core';
import Swal, {
  SweetAlertIcon,
  SweetAlertPosition,
  SweetAlertResult,
} from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class SweetAlertService {
  private defaultConfig = {
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-lg',
      cancelButton: 'rounded-lg',
    },
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
  };

  async confirmDelete(
    itemName: string,
    itemType: string = 'elemento'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `El ${itemType} "${itemName}" será eliminado permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
      reverseButtons: true,
      ...this.defaultConfig,
    });

    return result.isConfirmed;
  }

  async confirmCancelPayment(): Promise<boolean> {
    const result = await Swal.fire({
      title: '¿Cancelar pago?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancelar pago',
      cancelButtonText: 'Volver',
      reverseButtons: true,
      ...this.defaultConfig,
      confirmButtonColor: '#dc2626',
    });

    return result.isConfirmed;
  }

  showToast(position: SweetAlertPosition, icon: SweetAlertIcon, title: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: position,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });

    Toast.fire({
      icon: icon,
      title: title,
    });
  }

  async confirm(
    title: string,
    text: string,
    confirmButtonText: string = 'Confirmar',
    icon: SweetAlertIcon = 'warning'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title: title,
      text: text,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      ...this.defaultConfig,
      confirmButtonColor: '#f59e0b',
    });
  }

  showPaymentCancelled() {
    Swal.fire({
      title: 'Pago cancelado',
      text: 'El pago fue marcado como cancelado.',
      icon: 'success',
      timer: 1800,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  }

  // Método genérico para confirmar acciones CRUD
  async confirmAction(
    isEditMode: boolean,
    entityName: string,
    entityType: string = 'elemento'
  ): Promise<boolean> {
    const action = isEditMode ? 'actualizar' : 'crear';
    const actionPast = isEditMode ? 'actualizado' : 'creado';
    const icon = isEditMode ? 'question' : 'info';

    const result = await Swal.fire({
      title: `¿Confirmar ${action} ${entityType}?`,
      text: `${
        entityType.charAt(0).toUpperCase() + entityType.slice(1)
      } "${entityName}" será ${actionPast} con la información proporcionada`,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
      focusCancel: false,
      reverseButtons: true,
      customClass: {
        popup: 'rounded-lg',
        confirmButton: 'rounded-lg',
        cancelButton: 'rounded-lg',
      },
      confirmButtonColor: isEditMode ? '#f59e0b' : '#10b981',
      cancelButtonColor: '#6b7280',
    });

    return result.isConfirmed;
  }

  async confirmCustomAction(
    title: string,
    text: string,
    confirmButtonText: string = 'Confirmar',
    cancelButtonText: string = 'Cancelar',
    icon: 'warning' | 'question' | 'info' = 'question'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      focusCancel: false,
      reverseButtons: false,
      ...this.defaultConfig,
    });

    return result.isConfirmed;
  }

  async showInput(
    title: string,
    placeholder: string = '',
    inputType: 'text' | 'email' | 'password' = 'text'
  ) {
    const result = await Swal.fire({
      title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
        return null;
      },
      ...this.defaultConfig,
    });

    return result.isConfirmed ? result.value : null;
  }

  showLoading(
    title: string = 'Cargando...',
    text: string = 'Por favor espera'
  ) {
    return Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'rounded-lg',
      },
    });
  }

  showSuccess(title: string, text: string = '', timer: number = 2000): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  }

  showError(title: string, message: string): Promise<any> {
    Swal.close();

    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido',
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...this.defaultConfig,
    });
  }

  showInfo(title: string, text: string = '') {
    Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonText: 'Entendido',
      ...this.defaultConfig,
    });
  }

  async promptLoginForFavorites(): Promise<boolean> {
    const res = await this.showChoice(
      'Guardá tus favoritos',
      'Registrate o iniciá sesión para guardar tus favoritos y verlos en cada visita.',
      'Iniciar sesión',
      'Más tarde'
    );
    return res.isConfirmed;
  }

  async confirmLogout(userName?: string): Promise<boolean> {
    const greeting = userName ? `${userName}` : 'usuario';

    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: `¡Hasta luego, ${greeting}! ¿Estás seguro que deseas cerrar sesión?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      focusCancel: false,
      reverseButtons: true,
      customClass: {
        popup: 'rounded-lg',
        confirmButton: 'rounded-lg',
        cancelButton: 'rounded-lg',
      },
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
    });

    return result.isConfirmed;
  }

  async showChoice(
    title: string,
    text: string = '',
    confirmButtonText: string = 'Aceptar',
    cancelButtonText: string = 'Cancelar'
  ): Promise<SweetAlertResult<any>> {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: false,
      ...this.defaultConfig,
    });
  }

  async inputText(
    title: string,
    text: string = '',
    placeholder: string = 'Ingresá tu nombre'
  ): Promise<SweetAlertResult<any>> {
    return Swal.fire({
      title,
      text,
      input: 'text',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      allowEscapeKey: false,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Por favor ingresá un nombre válido';
        }
        return null;
      },
      ...this.defaultConfig,
    });
  }

  closeLoading() {
    Swal.close();
  }

  showGuestWelcome(name: string, table?: number) {
    Swal.fire({
      title: `¡Bienvenido ${name}!`,
      text: table ? `Te uniste a la mesa ${table}.` : '',
      icon: 'success',
      timer: 1800,
      timerProgressBar: true,
      showConfirmButton: false,
      ...this.defaultConfig,
    });
  }

  showLogoutSuccess(userName?: string) {
    const message = userName ? `¡Hasta luego, ${userName}!` : '¡Hasta luego!';

    Swal.fire({
      title: message,
      text: 'Has cerrado sesión correctamente.',
      icon: 'success',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  }

  close() {
    Swal.close();
  }

  closeAll() {
    try {
      Swal.close();
    } catch {}
  }

  showConfirmableSuccess(
    title: string,
    text: string = '',
    confirmButtonText: string = 'Aceptar'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      showConfirmButton: true,
      confirmButtonText: confirmButtonText,
      ...this.defaultConfig,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  }

  /**
   * Muestra un popup de error que REQUIERE la confirmación del usuario.
   * Devuelve una promesa para que se pueda actuar después.
   * @param title Título del popup
   * @param text Texto del popup
   * @param confirmButtonText Texto del botón (ej. 'Ir al Inicio')
   */
  showConfirmableError(
    title: string,
    text: string = '',
    confirmButtonText: string = 'Entendido'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      showConfirmButton: true,
      confirmButtonText: confirmButtonText,
      ...this.defaultConfig,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  }
}
