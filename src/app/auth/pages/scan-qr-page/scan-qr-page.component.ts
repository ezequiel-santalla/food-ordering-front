import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, QrCode, Scan } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { TableSessionService } from '../../../store-front/services/table-session.service';

@Component({
  selector: 'app-scan-qr-page',
  imports: [LucideAngularModule],
  templateUrl: './scan-qr-page.component.html',
})
export class ScanQrPageComponent {
  readonly QrCode = QrCode;
  readonly Scan = Scan;

  private authService = inject(AuthService);
  private router = inject(Router);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);

  isSubmitting = signal(false);
  readonly TEST_TABLE_ID = '9fa8654a-2d0b-4e3b-8939-cd08c7b1e094';

  constructor() {
    // Verificar si ya tiene sesión al entrar
    const currentSession = this.authService.tableSessionId();
    if (currentSession && currentSession !== 'undefined' && currentSession !== 'null') {
      console.log('✅ Ya tiene sesión activa, redirigiendo...');
      this.router.navigate(['/'], { replaceUrl: true });
    }

    // Effect para reaccionar a cambios en tableSessionId
    effect(() => {
      const tableSessionId = this.authService.tableSessionId();

      if (tableSessionId &&
          tableSessionId !== 'undefined' &&
          tableSessionId !== 'null' &&
          !this.isSubmitting()) {
        console.log('✅ Sesión detectada, redirigiendo al menú...');

        setTimeout(() => {
          this.router.navigate(['/'], { replaceUrl: true });
        }, 100);
      }
    });
  }

  simulateScan() {
    const currentSession = this.authService.tableSessionId();

    // Verificar sesión activa válida
    if (currentSession && currentSession !== 'undefined' && currentSession !== 'null') {
      console.log('⚠️ Ya tienes una sesión activa:', currentSession);
      this.sweetAlertService.showInfo(
        'Sesión activa',
        'Ya tienes una sesión de mesa activa'
      );
      this.router.navigate(['/']);
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

        // Validar que la respuesta tenga los datos necesarios
        if (!response || !response.tableNumber || !response.participants) {
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

        // El effect manejará la navegación cuando se actualice tableSessionId
      },
      error: (error) => {
        console.error('❌ Error escaneando QR:', error);
        this.isSubmitting.set(false);

        const { title, message } = this.getErrorMessage(error);
        this.sweetAlertService.showError(title, message);
      }
    });
  }

  private getErrorMessage(error: any): { title: string, message: string } {
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
      default:
        return {
          title: 'Error al conectar',
          message: 'No se pudo conectar con la mesa. Intenta nuevamente.'
        };
    }
  }
}
