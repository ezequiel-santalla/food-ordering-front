import { inject, Injectable, signal } from '@angular/core';
import { SweetAlertService } from '../shared/services/sweet-alert.service';
import { TableSessionService } from '../store-front/services/table-session.service';
import { ErrorHandlerService } from '../shared/services/error-handler.service';
import { NavigationService } from '../shared/services/navigation.service';
import { SessionUtils } from '../utils/session-utils';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class QrProcessingService {
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

  // Usamos un signal interno para evitar procesar dos QR a la vez
  private isSubmitting = signal(false);

  /**
   * Método centralizado para procesar un ID de mesa.
   * Usado tanto por el escáner interno como por la ruta de URL.
   */
  processTableId(tableId: string): void {
    if (this.isSubmitting()) {
      console.warn('Procesamiento de QR ya en curso.');
      return;
    }

    const currentSession = this.authService.tableSessionId();

    // 1. Verificar sesión activa válida
    if (SessionUtils.isValidSession(currentSession)) {
      console.log('⚠️ Ya tienes una sesión activa:', currentSession);
      this.sweetAlertService.showInfo(
        'Sesión activa',
        'Ya tienes una sesión de mesa activa'
      );
      this.navigation.navigateToHome();
      return;
    }

    console.log('🔍 Iniciando procesamiento de QR...');
    this.isSubmitting.set(true);

    this.sweetAlertService.showLoading(
      'Validando mesa...',
      'Conectando con la mesa'
    );

    // 2. Llamar al servicio de autenticación
    this.authService.scanQR(tableId).subscribe({
      next: (response) => {
        console.log('✅ QR procesado exitosamente:', response);

        if (!response?.tableNumber || !response?.participants) {
          this.handleInvalidResponse();
          return;
        }

        // 3. Determinar el Nickname
        const nickname = this.determineNickname(response.participants);
        console.log('📝 Nickname final:', nickname);

        // 4. Guardar info de la sesión
        this.tableSessionService.setTableSessionInfo(
          response.tableNumber,
          nickname,
          response.participants.length
        );

        // 5. Mostrar éxito y finalizar
        const finalNickname = nickname.toLocaleLowerCase().startsWith('guest')
          ? 'Invitado'
          : nickname;

        this.sweetAlertService.showSuccess(
          `¡Bienvenido ${finalNickname}!`,
          `Te has unido a la mesa ${response.tableNumber}`
        );
        this.isSubmitting.set(false);
        this.navigation.navigateToHome();
      },
      error: (error) => {
        console.error('❌ Error procesando QR:', error);
        this.isSubmitting.set(false);
        const { title, message } = this.errorHandler.getQrScanError(error);
        this.sweetAlertService.showError(title, message);
        setTimeout(() => {
          this.navigation.navigateToHome();
        }, 2500);
      },
    });
  }

  // --- Métodos privados de ayuda ---

  private determineNickname(participants: any[]): string {
    const participantId = this.authService.participantId();
    const currentParticipant = participants.find(
      (p) => p.publicId === participantId
    );

    if (currentParticipant) {
      if (currentParticipant.nickname) return currentParticipant.nickname;
      if (currentParticipant.user?.name) return currentParticipant.user.name;
      return 'Usuario';
    }
    return 'Guest'; // Es un invitado
  }

  private handleInvalidResponse(): void {
    console.error('❌ Respuesta inválida del servidor');
    this.isSubmitting.set(false);
    this.sweetAlertService.showError(
      'Error',
      'La respuesta del servidor no es válida'
    );
  }
}