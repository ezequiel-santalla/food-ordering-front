import { Component, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, QrCode, Scan } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { TableSessionService } from '../../../store-front/services/table-session.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { SessionUtils } from '../../../utils/session-utils';

@Component({
  selector: 'app-scan-qr-page',
  imports: [LucideAngularModule],
  templateUrl: './scan-qr-page.component.html',
})
export class ScanQrPageComponent {
  readonly QrCode = QrCode;
  readonly Scan = Scan;

  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

  isSubmitting = signal(false);
  readonly TEST_TABLE_ID = '187ee312-24b2-4f54-a27b-c18a5b5e8bf0';

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

  simulateScan() {
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

    this.authService.scanQR(this.TEST_TABLE_ID).subscribe({
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

        this.tableSessionService.setTableSessionInfo(
          response.tableNumber,
          response.participants.length
        );

        this.sweetAlertService.showSuccess(
          '¡Bienvenido!',
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
