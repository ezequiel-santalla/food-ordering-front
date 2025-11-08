import { inject, Injectable, signal } from '@angular/core';
import { SweetAlertService } from '../shared/services/sweet-alert.service';
import { TableSessionService } from '../store-front/services/table-session.service';
import { ErrorHandlerService } from '../shared/services/error-handler.service';
import { NavigationService } from '../shared/services/navigation.service';
import { SessionUtils } from '../utils/session-utils';
import { AuthService } from '../auth/services/auth.service';
import { Participant } from '../shared/models/common';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QrProcessingService {
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

  // Signal interno para evitar procesar dos QR a la vez
  private isSubmitting = signal(false);

  processTableId(tableId: string): void {
    if (this.isSubmitting()) {
      console.warn('Procesamiento de QR ya en curso.');
      return;
    }

    const currentSession = this.authService.tableSessionId();

    if (SessionUtils.isValidSession(currentSession)) {
      console.log('⚠️ Ya tenés una sesión activa:', currentSession);
      this.sweetAlertService.showInfo(
        'Sesión activa',
        'Ya tenés una sesión de mesa activa'
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

    this.authService
      .scanQR(tableId)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          console.log('✅ QR procesado exitosamente:', response);

          if (!response?.tableNumber || !response?.activeParticipants) {
            this.handleInvalidResponse();
            return;
          }

          const participantId = this.authService.participantId();

          const nickname = this.getNicknameFromResponse(response);
          console.log('📝 Nickname final:', nickname);

          this.tableSessionService.setTableSessionInfo(
            response.tableNumber,
            nickname,
            response.numberOfParticipants || 0,
            participantId || undefined
          );

          this.sweetAlertService.showSuccess(
            `¡Bienvenido ${nickname}!`,
            `Te has unido a la mesa ${response.tableNumber}`
          );
          this.navigation.navigateToHome();
        },
        error: (errorResponse) => {
          console.error('❌ Error procesando QR:', errorResponse);
          this.isSubmitting.set(false);

          const backendError = errorResponse.error;

          let title = 'Error';
          let message = 'No se pudo procesar el QR.';

          if (backendError && backendError.message) {
            message = backendError.message;

            if (backendError.appCode === 'COMPLETE') {
              title = 'Mesa Llena';
              message = 'La mesa escaneada no admite mas participantes';
            } else if (backendError.appCode === 'OUT_OF_SERVICE') {
              title = 'Mesa Fuera de Servicio';
              message = 'La mesa no se encuentra habilitada para iniciar sesión';
            } else {
              title = 'No disponible';
              message = 'Ocurrió un error al iniciar sesión';
            }
          } else if (errorResponse.status === 409) {
            // Fallback por si algo falla en el JSON
            title = 'Acción no permitida';
            message = 'Ya existe un conflicto con esta acción.';
          }

          this.sweetAlertService.showError(title, message);

          setTimeout(() => {
            this.navigation.navigateToHome();
          }, 2500);
        },
      });
  }

  // --- Métodos privados de ayuda ---

  private getNicknameFromResponse(response: any): string {
    const participantId = this.authService.participantId();
    const actives = response?.activeParticipants ?? [];
    const previous = response?.previousParticipants ?? [];

    let current: Participant | undefined = actives.find(
      (p: any) => p?.publicId === participantId
    );

    if (!current) {
      current = previous.find((p: any) => p?.publicId === participantId);
    }

    if (!current && response?.isHostClient && response?.hostClient) {
      current = response.hostClient;
    }

    let nickname: string | undefined;

    if (current) {
      if (current.user?.name) {
        nickname = current.user.name;
        console.log('✅ Usando nombre del usuario (user.name):', nickname);
      } else if (
        current.nickname &&
        !current.nickname.toLowerCase().startsWith('guest')
      ) {
        nickname = current.nickname;
        console.log(
          '✅ Usando nickname del participante (nickname):',
          nickname
        );
      } else if (current.nickname) {
        nickname = current.nickname;
        console.log('⚠️ Usando nickname de Guest (para conversión):', nickname);
      }
    }

    const safeNick = this.toSafeNickname(nickname, participantId);
    return safeNick;
  }

  private toSafeNickname(
    nickname: string | undefined,
    participantId: string | null
  ): string {
    const fallback = `Invitado-${(participantId ?? '').slice(-4) || '0000'}`;
    if (!nickname || typeof nickname !== 'string') return fallback;

    const lower = nickname.toLowerCase();
    if (lower.startsWith('guest')) {
      return nickname.replace(/^Guest/i, 'Invitado');
    }
    return nickname;
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
