import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CommonModule, Location } from '@angular/common';
import { QrProcessingService } from '../../services/qr-processing-service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [ZXingScannerModule, CommonModule],
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
  host: {
    '[class.scanner-active]': 'showScanner() || processing()',
  },
})
export class QrScannerComponent implements OnInit, OnDestroy {
  showScanner = signal(false);
  processing = signal(false);
  private qrProcessingService = inject(QrProcessingService);
  private sweetAlert = inject(SweetAlertService);
  private location = inject(Location);

  async ngOnInit(): Promise<void> {
    this.showScanner.set(true);
  }

  ngOnDestroy(): void {
    this.showScanner.set(false);
  }

  onScanSuccess(scannedUrl: string): void {
    console.log('QR escaneado:', scannedUrl);
    this.showScanner.set(false);

    try {
      const url = new URL(scannedUrl);
      let tableId: string | undefined;

      if (url.hash.includes('/scan-qr/')) {
        const hashParts = url.hash.split('/');
        tableId = hashParts.pop();
        console.log('ID extraído desde el HASH:', tableId);
      } else if (url.pathname.includes('/scan-qr/')) {
        const pathParts = url.pathname.split('/');
        tableId = pathParts.pop();
        console.log('ID extraído desde el PATH:', tableId);
      }
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

      setTimeout(() => {
        this.location.back();
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

    setTimeout(() => {
      this.location.back();
    }, 2500);
  }

  cancelScan(): void {
    console.log('Escaneo cancelado manualmente por el usuario.');
    this.showScanner.set(false);
    this.location.back();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
