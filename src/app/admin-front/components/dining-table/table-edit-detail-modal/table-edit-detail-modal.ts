import { Component, inject, input, output, signal } from '@angular/core';
import { TablePositionResponse } from '../../../models/lounge';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditTableModal } from "../edit-table-modal/edit-table-modal";
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { DiningTableService } from '../../../services/dining-table-service';
import { QrCodeModal } from "../qr-code-modal/qr-code-modal";

@Component({
  selector: 'app-table-edit-detail-modal',
  imports: [CommonModule, FormsModule, EditTableModal, QrCodeModal],
  templateUrl: './table-edit-detail-modal.html'
})
export class TableEditDetailModal {
  table = input.required<TablePositionResponse>();
  close = output<void>();
  sizeChanged = output<{ tableId: string, width: number, height: number }>();
  removed = output<string>();
  dataUpdated = output<TablePositionResponse>();
  currentWidth: number = 200;
  currentHeight: number = 80;
  isEditing = signal(false);

  showQrModal = signal(false);
  qrCodeUrl = signal<string | null>(null);
  qrLoading = signal(false);
  qrError = signal<string | null>(null);

  private sweetAlertService = inject(SweetAlertService);
  private diningTableService = inject(DiningTableService);

  ngOnInit(): void {
    this.currentWidth = this.table().width || 200;
    this.currentHeight = this.table().height || 80;
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  increaseWidth(): void {
    if (this.currentWidth < 400) {
      this.currentWidth += 20;
      this.onSizeChange();
    }
  }

  decreaseWidth(): void {
    if (this.currentWidth > 60) {
      this.currentWidth -= 20;
      this.onSizeChange();
    }
  }

  increaseHeight(): void {
    if (this.currentHeight < 400) {
      this.currentHeight += 10;
      this.onSizeChange();
    }
  }

  decreaseHeight(): void {
    if (this.currentHeight > 60) {
      this.currentHeight -= 10;
      this.onSizeChange();
    }
  }

  onSizeChange(): void {
    this.sizeChanged.emit({
      tableId: this.table().diningTableId,
      width: this.currentWidth,
      height: this.currentHeight
    });
  }
  rotateBar(): void {
  const temp = this.currentWidth;
  this.currentWidth = this.currentHeight;
  this.currentHeight = temp;
  this.onSizeChange();
}

  async onRemove(): Promise<void> {
    const confirmed = await this.sweetAlertService.confirmCustomAction(
      '¿Eliminar mesa del salón?',
      `La mesa ${this.table().diningTableNumber} será removida del salón. Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar',
      'warning'
    );

    if (confirmed) {
      this.removed.emit(this.table().diningTableId);
    }
  }

  async onShowQrCode(): Promise<void> {
    this.showQrModal.set(true);
    this.qrLoading.set(true);
    this.qrError.set(null);

    try {
      const baseUrl = `${window.location.origin}/#/scan-qr`;

      const response = await this.diningTableService.generateQrCode(
        baseUrl,
        this.table().diningTableNumber
      ).toPromise();

      if (response && response.qrCodeUrl) {
        this.qrCodeUrl.set(response.qrCodeUrl);
      } else {
        throw new Error('No se recibió URL del código QR');
      }
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      this.qrError.set('Error al obtener el código QR. Por favor, intenta nuevamente.');
    } finally {
      this.qrLoading.set(false);
    }
  }

  onCloseQrModal(): void {
    this.showQrModal.set(false);
    this.qrCodeUrl.set(null);
    this.qrError.set(null);
  }

  onRetryQr(): void {
    this.onShowQrCode();
  }



  getStatusLabel(): string {
    const statusMap: { [key: string]: string } = {
      'AVAILABLE': 'Disponible',
      'IN_SESSION': 'En Sesión',
      'COMPLETE': 'Completa',
      'WAITING_RESET': 'Esperando Reset',
      'OUT_OF_SERVICE': 'Fuera de Servicio'
    };
    return statusMap[this.table().diningTableStatus] || this.table().diningTableStatus;
  }

  getStatusBadgeClass(): string {
    const baseClasses = 'inline-flex px-3 py-1 rounded-full text-sm font-semibold';
    const statusColors: { [key: string]: string } = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'IN_SESSION': 'bg-blue-100 text-blue-800',
      'COMPLETE': 'bg-yellow-100 text-yellow-800',
      'WAITING_RESET': 'bg-orange-100 text-orange-800',
      'OUT_OF_SERVICE': 'bg-gray-100 text-gray-800'
    };
    return `${baseClasses} ${statusColors[this.table().diningTableStatus] || 'bg-gray-100 text-gray-800'}`;
  }

  getShapeLabel(): string {
    const shapeMap: { [key: string]: string } = {
      'round': 'Redonda',
      'square': 'Cuadrada',
      'rect': 'Barra'
    };
    return shapeMap[this.table().tableShape] || this.table().tableShape;
  }

  onEdit(): void {
    this.isEditing.set(true);
  }

  onCloseEditModal(): void {
    this.isEditing.set(false);
  }

  onTableEdited(updatedTable: TablePositionResponse): void {
    this.dataUpdated.emit(updatedTable);
    this.isEditing.set(false);
    this.onClose();
  }

  setPresetSize(size: 'small' | 'medium' | 'large'): void {
  const presets = {
    small: 80,
    medium: 100,
    large: 120
  };

  this.currentWidth = presets[size];
  this.currentHeight = presets[size]; // Mantener proporción 1:1
  this.onSizeChange();
}
}
