import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { LucideAngularModule, QrCode, Scan } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { TableSessionService } from '../../../store-front/services/table-session.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { SessionUtils } from '../../../utils/session-utils';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-scan-qr-page',
  imports: [LucideAngularModule],
  templateUrl: './scan-qr-page.component.html',
})
export class ScanQrPageComponent implements OnInit {
  readonly QrCode = QrCode;
  readonly Scan = Scan;

  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);
  private route = inject(ActivatedRoute);

  isSubmitting = signal(false);

  constructor() {
    // Verificar si ya tiene sesión al entrar
    if (this.navigation.navigateToHomeIfHasSession()) {
      return;
    }

    // Effect para reaccionar a cambios en tableSessionId
    effect(() => {
      const tableSessionId = this.authService.tableSessionId();

      if (SessionUtils.isValidSession(tableSessionId) && !this.isSubmitting()) {
        console.log('✅ Sesión detectada, redirigiendo al menú...');
        setTimeout(() => this.navigation.navigateToHome(), 100);
      }
    });
  }

  ngOnInit(): void {
    const tableIdFromUrl = this.route.snapshot.paramMap.get('tableId');

    if (tableIdFromUrl) {
      console.log('ID de la mesa capturado desde la URL:', tableIdFromUrl);
      this.processScan(tableIdFromUrl);
    } else {
      console.error('No se encontró un ID de mesa en la URL.');
      this.sweetAlertService.showError(
        'URL Inválida',
        'El código QR no proporcionó un ID de mesa válido.'
      );
    }
  }

  processScan(tableId: string): void {
    const currentSession = this.authService.tableSessionId();

    // Verificar sesión activa válida
    if (SessionUtils.isValidSession(currentSession)) {
      console.log('⚠️ Ya tienes una sesión activa:', currentSession);
      this.sweetAlertService.showInfo(
        'Sesión activa',
        'Ya tienes una sesión de mesa activa'
      );
      this.navigation.navigateToHome();
      return;
    }

    console.log('🔍 Iniciando escaneo de QR, sesión actual:', currentSession);
    this.isSubmitting.set(true);

    this.sweetAlertService.showLoading(
      'Escaneando mesa...',
      'Conectando con la mesa'
    );

    this.authService.scanQR(tableId).subscribe({
      next: (response) => {
        console.log('✅ QR escaneado exitosamente:', response);

        if (!response?.tableNumber || !response?.participants) {
          console.error('❌ Respuesta inválida del servidor');
          this.isSubmitting.set(false);
          this.sweetAlertService.showError(
            'Error',
            'La respuesta del servidor no es válida'
          );
          return;
        }

        // Obtener participantId del token decodificado
        const participantId = this.authService.participantId();
        console.log('🔍 ParticipantId del token:', participantId);

        // Buscar el participante actual en la lista
        const currentParticipant = response.participants.find(
          p => p.publicId === participantId
        );

        console.log('👤 Participante encontrado:', currentParticipant);

        // Determinar el nickname según el tipo de usuario
        let nickname: string;

        if (currentParticipant) {
          // Si encontramos el participante, usar su nickname o el nombre del usuario
          if (currentParticipant.nickname) {
            nickname = currentParticipant.nickname;
            console.log('✅ Usando nickname del participante:', nickname);
          } else if (currentParticipant.user?.name) {
            nickname = currentParticipant.user.name;
            console.log('✅ Usando nombre del usuario:', nickname);
          } else {
            nickname = 'Usuario';
            console.log('⚠️ Participante sin nickname ni nombre, usando "Usuario"');
          }
        } else {
          // Si no encontramos el participante, es un invitado
          nickname = 'Guest';
          console.log('👻 Participante no encontrado, es invitado (Guest)');
        }

        console.log('📝 Nickname final:', nickname);

        // Guardar info de la sesión con el nickname correcto
        this.tableSessionService.setTableSessionInfo(
          response.tableNumber,
          nickname,
          response.participants.length
        );

        if (nickname.toLocaleLowerCase().startsWith('guest')) {
          nickname = 'Invitado';
        }

        this.sweetAlertService.showSuccess(
          `¡Bienvenido ${nickname}!`,
          `Te has unido a la mesa ${response.tableNumber}`
        );

        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('❌ Error escaneando QR:', error);
        this.isSubmitting.set(false);

        const { title, message } = this.errorHandler.getQrScanError(error);
        this.sweetAlertService.showError(title, message);
      }
    });
  }
}
