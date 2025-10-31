import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sector-modal',
  imports: [FormsModule],
  templateUrl: './sector-modal.html'
})
export class SectorModal {

  @Output() close = new EventEmitter<void>();
  @Output() sectorCreated = new EventEmitter<string>();

  sectorName: string = '';

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onSubmit(): void {
    if (this.sectorName.trim()) {
      this.sectorCreated.emit(this.sectorName.trim());
      this.sectorName = '';
    }
  }
}
