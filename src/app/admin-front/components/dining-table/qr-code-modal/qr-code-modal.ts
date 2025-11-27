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

  onDownload(): void {
    const link = document.createElement('a');
    link.href = this.qrCodeUrl();
    link.download = `QR-Mesa-${this.tableNumber()}.png`;
    link.click();
  }

  onOpenNewTab(): void {
    window.open(this.qrCodeUrl(), '_blank');
  }

  onRetry(): void {
    this.retry.emit();
  }
}
