import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationService } from '../../../shared/services/navigation.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { QrProcessingService } from '../../../services/qr-processing-service';

@Component({
  selector: 'app-qr-scan-handler',
  standalone: true,
  template: '', // <-- No tiene HTML
})
export class QrScanHandlerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private navigation = inject(NavigationService);
  private sweetAlert = inject(SweetAlertService);
  private qrProcessingService = inject(QrProcessingService);

  ngOnInit(): void {
    const tableIdFromUrl = this.route.snapshot.paramMap.get('tableId');

    if (tableIdFromUrl) {
      console.log(
        'Handler: ID de la mesa capturado desde la URL:',
        tableIdFromUrl
      );
      // Pasa el trabajo al servicio
      this.qrProcessingService.processTableId(tableIdFromUrl);
    } else {
      console.error('Handler: No se encontró un ID de mesa en la URL.');
      this.sweetAlert.showError(
        'URL Inválida',
        'El código QR no proporcionó un ID de mesa válido.'
      );
      this.navigation.navigateToHome();
    }
  }
}
