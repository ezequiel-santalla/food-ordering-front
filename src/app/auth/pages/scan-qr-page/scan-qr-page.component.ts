// auth/pages/scan-qr-page/scan-qr-page.component.ts
import { Component, inject, signal } from '@angular/core';
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

  readonly TEST_TABLE_ID = 'edb7eb59-9991-4972-a519-6fb57d5bcddb';

  simulateScan() {
    this.isSubmitting.set(true);

    this.sweetAlertService.showLoading(
      'Escaneando mesa...',
      'Conectando con la mesa'
    );

    this.authService.scanQR(this.TEST_TABLE_ID).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);

        // Guardar info de la sesión
        this.tableSessionService.setTableSessionInfo(
          response.tableNumber,
          response.participants.length
        );

        this.sweetAlertService.showSuccess(
          '¡Conexión exitosa!',
          `Te has unido a la mesa ${response.tableNumber}`
        );

        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error en scan QR:', error);
        this.isSubmitting.set(false);

        const { title, message } = this.getErrorMessage(error);
        this.sweetAlertService.showError(title, message);
      }
    });
  }

  private getErrorMessage(error: any): { title: string, message: string } {
    switch (error.status) {
      case 404:
        return {
          title: 'Mesa no encontrada',
          message: 'No existe una mesa con ese ID.'
        };
      case 409:
        return {
          title: 'Mesa ocupada',
          message: 'La mesa ya tiene una sesión activa.'
        };
      case 401:
        return {
          title: 'No autorizado',
          message: 'Debes iniciar sesión primero.'
        };
      default:
        return {
          title: 'Error al conectar',
          message: 'No se pudo conectar con la mesa. Intenta nuevamente.'
        };
    }
  }
}
