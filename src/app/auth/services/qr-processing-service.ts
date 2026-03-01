import { inject, Injectable, signal } from '@angular/core';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { TableSessionService } from '../../store-front/services/table-session-service';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { NavigationService } from '../../shared/services/navigation.service';
import { SessionUtils } from '../../utils/session-utils';
import { AuthService } from '../../auth/services/auth-service';
import { Participant } from '../../shared/models/common';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

export interface TableAccessRequest {
  tableId?: string;
  shortCode?: string;
  nickname?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class QrProcessingService {
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

  private isSubmitting = signal(false);
  public isInQrFlow = signal(false);

  processTableRequest(request: TableAccessRequest): void {
    this.isInQrFlow.set(true);

    const current = this.authService.tableSessionId();

    if (SessionUtils.isValidSession(current)) {
      this.sweetAlertService.showInfo(
        'Sesión activa',
        'Ya estás participando en una mesa. No es posible escanear otra.'
      );
      this.navigation.navigateToHome();
      return;
    }

    if (this.isSubmitting()) {
      console.warn('Procesamiento de QR ya en curso.');
      return;
    }

    const isAuthenticated = this.authService.isAuthenticated();

    if (isAuthenticated) {
      this.processAuthenticatedUser(request);
      return;
    }

    this.processGuestFlow(request);
  }

  private processAuthenticatedUser(request: TableAccessRequest): void {
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
      .scanQR(request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          console.log('✅ QR procesado exitosamente:', response);

          if (!response?.tableNumber || !response?.activeParticipants) {
            this.handleInvalidResponse();
            return;
          }

          const nickname = this.getNicknameFromResponse(response);
          console.log('📝 Nickname final:', nickname);

          this.tableSessionService.setTableSessionInfo(
            response.tableNumber,
            nickname,
            response.numberOfParticipants || 0,
            response.tableCapacity ?? null,
          );

          this.sweetAlertService.showSuccess(
            `¡Bienvenido ${nickname}!`,
            `Te has unido a la mesa ${response.tableNumber}`
          );
          this.navigation.navigateToHome();
        },
        error: (err) => this.handleScanError(err),
      });
  }

  private processGuestFlow(request: TableAccessRequest): void {
    this.sweetAlertService
      .showChoice(
        '¿Cómo querés continuar?',
        'Podés ingresar como invitado o iniciar sesión.',
        'Seguir como invitado',
        'Iniciar sesión'
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.askGuestName(request);
          return;
        }

        Swal.close();
        
        this.authService.setPendingTableScan(JSON.stringify(request));

        queueMicrotask(() => this.navigation.navigateToLogin());
      });
  }

  private askGuestName(request: TableAccessRequest): void {
    this.sweetAlertService
      .inputText(
        'Ingresá tu nombre',
        'Este nombre aparecerá en la mesa',
        'Nombre del invitado'
      )
      .then((res) => {
        const nickname = res.value?.trim();

        if (res.isDismissed) {
          this.navigation.navigateToHome();
          return;
        }

        if (!nickname) {
          this.sweetAlertService.showError(
            'Nombre inválido',
            'Debés ingresar un nombre válido.'
          );
          return;
        }

        this.finishGuestScan(request, nickname);
      });
  }

  private finishGuestScan(request: TableAccessRequest, nickname: string): void {
    this.sweetAlertService.showLoading(
      'Uniéndote...',
      'Conectando con la mesa'
    );

    this.isSubmitting.set(true);

    const payloadConNickname: TableAccessRequest = {
      ...request,
      nickname: nickname
    };

    this.authService
      .scanQR(payloadConNickname)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.tableSessionService.setTableSessionInfo(
            response.tableNumber,
            nickname,
            response.numberOfParticipants || 0,
            response.tableCapacity ?? null,
          );

          this.sweetAlertService.showSuccess(
            `¡Bienvenido ${nickname}!`,
            `Te has unido a la mesa ${response.tableNumber}`
          );

          this.navigation.navigateToHome();
        },
        error: (err) => this.handleScanError(err),
      });
  }

  private handleScanError(errorResponse: any): void {
    console.error('❌ Error procesando QR:', errorResponse);

    this.isSubmitting.set(false);
    this.sweetAlertService.closeAll();

    const { title, message } = this.errorHandler.getQrScanError(errorResponse);

    this.sweetAlertService.showError(title, message).then(() => {
      this.navigation.navigateToHome();
    });
  }

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
