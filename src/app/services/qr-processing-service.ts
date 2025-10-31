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

          // 3. Determinar el Nickname
          // *** AQUÍ ESTÁ EL CAMBIO ***
          // Este método ahora es más inteligente y buscará el nombre del usuario logueado.
          const nickname = this.getNicknameFromResponse(response);
          console.log('📝 Nickname final:', nickname);

          // 4. Guardar info de la sesión
          this.tableSessionService.setTableSessionInfo(
            response.tableNumber,
            nickname,
            response.numberOfParticipants || 0,
            participantId || undefined
          );

          this.sweetAlertService.showSuccess(
            `¡Bienvenido ${nickname}!`, // <-- Ahora mostrará el nombre correcto
            `Te has unido a la mesa ${response.tableNumber}`
          );
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

  // ***** MÉTODO MODIFICADO *****
  private getNicknameFromResponse(response: any): string {
    const participantId = this.authService.participantId(); // string UUID
    const actives = response?.activeParticipants ?? [];
    const previous = response?.previousParticipants ?? [];

    // 1) Buscar en activos
    let current: Participant | undefined = actives.find(
      (p: any) => p?.publicId === participantId
    );

    // 2) Si no está, buscar en previos (puede venir ahí por timing/migración)
    if (!current) {
      current = previous.find((p: any) => p?.publicId === participantId);
    }

    // 3) Si soy host y vino hostClient, usarlo como fallback
    if (!current && response?.isHostClient && response?.hostClient) {
      current = response.hostClient;
    }

    // --- LÓGICA MEJORADA (inspirada en LoginPageComponent) ---
    let nickname: string | undefined;

    if (current) {
      // Prioridad 1: Usar el nombre de usuario si está vinculado
      if (current.user?.name) {
        nickname = current.user.name;
        console.log('✅ Usando nombre del usuario (user.name):', nickname);
      }
      // Prioridad 2: Usar el nickname si existe Y NO es un guest genérico
      else if (current.nickname && !current.nickname.toLowerCase().startsWith('guest')) {
        nickname = current.nickname;
        console.log('✅ Usando nickname del participante (nickname):', nickname);
      }
      // Prioridad 3: Usar el nickname de "Guest" (para convertirlo a "Invitado")
      else if (current.nickname) {
        nickname = current.nickname;
        console.log('⚠️ Usando nickname de Guest (para conversión):', nickname);
      }
    }
    
    // 4) Fallback definitivo: "Invitado-XXXX"
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