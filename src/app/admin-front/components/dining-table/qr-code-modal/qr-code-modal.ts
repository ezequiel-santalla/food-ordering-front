import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-code-modal',
  imports: [CommonModule],
  templateUrl: './qr-code-modal.html',
  styleUrl: './qr-code-modal.css'
})
export class QrCodeModal {
  qrCodeUrl = input.required<string>();
  tableNumber = input.required<number>();
  loading = input<boolean>(false);
  error = input<string | null>(null);

  close = output<void>();
  retry = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  async onDownload(): Promise<void> {
    try {
      const response = await fetch(this.qrCodeUrl());
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `QR-Mesa-${this.tableNumber()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Error al descargar el QR:', err);
    }
  }

  onOpenNewTab(): void {
    window.open(this.qrCodeUrl(), '_blank');
  }

  onRetry(): void {
    this.retry.emit();
  }
}
