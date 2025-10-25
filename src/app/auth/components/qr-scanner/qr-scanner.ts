import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CommonModule } from '@angular/common';
import { QrProcessingService } from '../../../services/qr-processing-service';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [ ZXingScannerModule, CommonModule],
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
  host: {
    '[class.scanner-active]': 'showScanner() || processing()',
  },
})
export class QrScannerComponent implements OnInit, OnDestroy {
  showScanner = signal(false);
  processing = signal(false);
  private scannerInitialized = false;
  private qrProcessingService = inject(QrProcessingService);
  private sweetAlert = inject(SweetAlertService);
  private navigation = inject(NavigationService);

  async ngOnInit(): Promise<void> {
    try {
      // Solicitar permiso con SweetAlert
      const isConfirmed = await this.sweetAlert.confirmCustomAction(
        'Escanear QR',
        'Se abrira la camara del dispositivo',
        'Permitir',
        'Denegar',
        'question'
      );

      if (isConfirmed) {
        console.log('Permiso de app concedido. Mostrando escaner...');

        // Cerrar explícitamente el modal antes de continuar
        this.sweetAlert.close();

        // Esperar a que el DOM se limpie completamente
        await this.delay(300);

        // Ahora sí mostrar el scanner
        this.showScanner.set(true);
        this.scannerInitialized = true;

        console.log('Scanner activado:', this.showScanner());
      } else {
        console.log('Permiso de app denegado por el usuario.');
        this.navigation.navigateBySessionState();
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      this.navigation.navigateBySessionState();
    }
  }

  ngOnDestroy(): void {
    // Limpieza al destruir el componente
    if (this.scannerInitialized) {
      this.showScanner.set(false);
    }
  }

  onScanSuccess(scannedUrl: string): void {
    console.log('QR escaneado:', scannedUrl);
    this.showScanner.set(false);

    try {
      const url = new URL(scannedUrl);
      const hashParts = url.hash.split('/');
      const tableId = hashParts.pop();

      if (!tableId || tableId.length < 36) {
        throw new Error('ID no encontrado en la URL del QR');
      }

      console.log('ID extraido:', tableId);

      this.qrProcessingService.processTableId(tableId);
    } catch (error) {
      console.error('Error al parsear la URL del QR:', error);
      this.showScanner.set(false);
      this.sweetAlert.showError(
        'QR Invalido',
        'El codigo QR no parece ser valido.'
      );

      // Dar tiempo para que se vea el mensaje antes de navegar
      setTimeout(() => {
        // CAMBIO: Usar navigateBySessionState
        this.navigation.navigateBySessionState();
      }, 2500);
    }
  }

  onScanError(error: Error): void {
    console.error('Error de la camara:', error);
    this.showScanner.set(false);

    this.sweetAlert.showError(
      'Error de Camara',
      'No se pudo acceder a la camara. Revisa los permisos del navegador.'
    );

    // Dar tiempo para que se vea el mensaje antes de navegar
    setTimeout(() => {
      // CAMBIO: Usar navigateBySessionState
      this.navigation.navigateBySessionState();
    }, 2500);
  }

  cancelScan(): void {
    console.log('Escaneo cancelado manualmente por el usuario.');
    this.showScanner.set(false);
    // CAMBIO: Usar navigateBySessionState
    this.navigation.navigateBySessionState();
  }

  // Método auxiliar para delays con promesas
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
