import { Injectable } from '@angular/core';
import Swal, {
  SweetAlertIcon,
  SweetAlertOptions,
  SweetAlertPosition,
  SweetAlertResult,
} from 'sweetalert2';

type ConfirmLogoutActiveTableResult = 'leave_and_logout' | 'dismiss';

@Injectable({ providedIn: 'root' })
export class SweetAlertService {
  // 🎨 Dinno Theme (ajustá colores si querés)
  private readonly theme = {
    danger: '#ef4444', // red-500 (cancel / delete)
    warning: '#f59e0b', // amber-500
    neutral: '#6b7280', // gray-500
    success: '#10b981', // emerald-500
    info: '#3b82f6', // blue-500
  } as const;

  // Clases globales para "estilo Dinno"
  // (la magia real la hacemos en CSS global con estas clases)
  private readonly baseClasses = {
    popup: 'dinno-swal dinno-swal--popup',
    title: 'dinno-swal--title',
    htmlContainer: 'dinno-swal--text',
    actions: 'dinno-swal--actions',
    confirmButton: 'dinno-swal--btn dinno-swal--btn-confirm',
    cancelButton: 'dinno-swal--btn dinno-swal--btn-cancel',
    denyButton: 'dinno-swal--btn dinno-swal--btn-deny',
    closeButton: 'dinno-swal--close',
    input: 'dinno-swal--input',
  } as const;

  private readonly defaultConfig: Partial<SweetAlertOptions> = {
    customClass: { ...this.baseClasses },
    confirmButtonColor: this.theme.warning,
    cancelButtonColor: this.theme.neutral,
    reverseButtons: true,
    focusCancel: true,
  };

  private fire<T = any>(options: SweetAlertOptions) {
    const merged = {
      ...this.defaultConfig,
      ...options,
      customClass: {
        ...(this.defaultConfig.customClass ?? {}),
        ...(options.customClass ?? {}),
      },
    } as SweetAlertOptions;

    return Swal.fire<T>(merged);
  }

  private toast(position: SweetAlertPosition) {
    return Swal.mixin({
      toast: true,
      position,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (t) => {
        t.onmouseenter = Swal.stopTimer;
        t.onmouseleave = Swal.resumeTimer;
      },
      customClass: {
        popup: 'dinno-toast',
        title: 'dinno-toast--title',
      },
    });
  }

  async confirmDelete(
    itemName: string,
    itemType: string = 'elemento',
  ): Promise<boolean> {
    const result = await this.fire({
      title: '¿Estás seguro?',
      text: `El ${itemType} "${itemName}" será eliminado permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
      reverseButtons: true,
      confirmButtonColor: this.theme.danger,
    });
    return result.isConfirmed;
  }

  async confirmCancelPayment(): Promise<boolean> {
    const result = await this.fire({
      title: '¿Cancelar pago?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancelar pago',
      cancelButtonText: 'Volver',
      reverseButtons: true,
      confirmButtonColor: this.theme.danger,
      focusCancel: true,
    });
    return result.isConfirmed;
  }

  showToast(position: SweetAlertPosition, icon: SweetAlertIcon, title: string) {
    this.toast(position).fire({ icon, title });
  }

  async confirm(
    title: string,
    text: string,
    confirmButtonText: string = 'Confirmar',
    icon: SweetAlertIcon = 'warning',
  ): Promise<SweetAlertResult> {
    return this.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: this.theme.warning,
    });
  }

  showPaymentCancelled() {
    this.fire({
      title: 'Pago cancelado',
      text: 'El pago fue marcado como cancelado.',
      icon: 'success',
      timer: 1800,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
  }

  async confirmAction(
    isEditMode: boolean,
    entityName: string,
    entityType: string = 'elemento',
  ): Promise<boolean> {
    const action = isEditMode ? 'actualizar' : 'crear';
    const actionPast = isEditMode ? 'actualizado' : 'creado';
    const icon: SweetAlertIcon = isEditMode ? 'question' : 'info';

    const result = await this.fire({
      title: `¿Confirmar ${action} ${entityType}?`,
      text: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${entityName}" será ${actionPast} con la información proporcionada`,
      icon,
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
      focusCancel: false,
      reverseButtons: true,
      confirmButtonColor: isEditMode ? this.theme.warning : this.theme.success,
    });

    return result.isConfirmed;
  }

  async confirmCustomAction(
    title: string,
    text: string,
    confirmButtonText: string = 'Confirmar',
    cancelButtonText: string = 'Cancelar',
    icon: 'warning' | 'question' | 'info' = 'question',
  ): Promise<boolean> {
    const result = await this.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      focusCancel: false,
      reverseButtons: false,
    });

    return result.isConfirmed;
  }

  async showInput(
    title: string,
    placeholder: string = '',
    inputType: 'text' | 'email' | 'password' = 'text',
  ) {
    const result = await this.fire<string>({
      title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Este campo es requerido';
        return null;
      },
    });

    return result.isConfirmed ? result.value : null;
  }

  showLoading(
    title: string = 'Cargando...',
    text: string = 'Por favor espera',
  ) {
    return this.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      showConfirmButton: false,
    });
  }

  showSuccess(
    title: string,
    text: string = '',
    timer: number = 2000,
  ): Promise<SweetAlertResult> {
    return this.fire({
      title,
      text,
      icon: 'success',
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  showError(title: string, message: string): Promise<any> {
    Swal.close();
    return this.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: this.theme.danger,
      showCancelButton: false,
    });
  }

  showInfo(title: string, text: string = '') {
    this.fire({
      title,
      text,
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.theme.info,
      showCancelButton: false,
    });
  }

  async promptLoginForFavorites(): Promise<boolean> {
    const res = await this.showChoice(
      'Guardá tus favoritos',
      'Registrate o iniciá sesión para guardar tus favoritos y verlos en cada visita.',
      'Iniciar sesión',
      'Más tarde',
    );
    return res.isConfirmed;
  }

  async confirmLogout(userName?: string): Promise<boolean> {
    const greeting = userName ? `${userName}` : 'usuario';

    const result = await this.fire({
      title: '¿Cerrar sesión?',
      text: `¡Hasta luego, ${greeting}! ¿Estás seguro que deseas cerrar sesión?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      focusCancel: false,
      reverseButtons: true,
      confirmButtonColor: this.theme.warning,
    });

    return result.isConfirmed;
  }

  async showChoice(
    title: string,
    text: string = '',
    confirmButtonText: string = 'Aceptar',
    cancelButtonText: string = 'Cancelar',
  ): Promise<SweetAlertResult<any>> {
    return this.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: false,
    });
  }

  async inputText(
    title: string,
    text: string = '',
    placeholder: string = 'Ingresá tu nombre',
  ): Promise<SweetAlertResult<any>> {
    return this.fire({
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
        if (!value || !value.trim())
          return 'Por favor ingresá un nombre válido';
        return null;
      },
    });
  }

  closeLoading() {
    Swal.close();
  }

  showGuestWelcome(name: string, table?: number) {
    this.fire({
      title: `¡Bienvenido ${name}!`,
      text: table ? `Te uniste a la mesa ${table}.` : '',
      icon: 'success',
      timer: 1800,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  showLogoutSuccess(userName?: string) {
    const message = userName ? `¡Hasta luego, ${userName}!` : '¡Hasta luego!';

    this.fire({
      title: message,
      text: 'Has cerrado sesión correctamente.',
      icon: 'success',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
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
    confirmButtonText: string = 'Aceptar',
  ): Promise<SweetAlertResult> {
    return this.fire({
      title,
      text,
      icon: 'success',
      showConfirmButton: true,
      confirmButtonText,
      showCancelButton: false,
      confirmButtonColor: this.theme.success,
    });
  }

  showConfirmableError(
    title: string,
    text: string = '',
    confirmButtonText: string = 'Entendido',
  ): Promise<SweetAlertResult> {
    return this.fire({
      title,
      text,
      icon: 'error',
      showConfirmButton: true,
      confirmButtonText,
      showCancelButton: false,
      confirmButtonColor: this.theme.danger,
    });
  }

  async confirmLogoutWithActiveTable(): Promise<ConfirmLogoutActiveTableResult> {
    const result = await this.fire({
      title: 'Sesión de mesa activa',
      text: 'Si cerrás sesión vas a abandonar la mesa, ¿estás seguro?',
      icon: 'question',

      showConfirmButton: true,
      showDenyButton: true,
      showCancelButton: false,

      confirmButtonText: 'Abandonar mesa y salir',
      confirmButtonColor: this.theme.danger,

      denyButtonText: 'Quedarme',
      denyButtonColor: this.theme.info,

      showCloseButton: true,
      allowOutsideClick: false,
      allowEscapeKey: true,

      customClass: {
        actions: 'dinno-swal--actions dinno-swal--actions-vertical',
      },
    });

    if (result.isConfirmed) return 'leave_and_logout';
    return 'dismiss';
  }
}
