import { Component, input, output } from '@angular/core';
import { DiningTableRequest } from '../../models/dining-table';
import { DiningTableService } from '../../services/dining-table-service';
import { TablePositionResponse } from '../../models/lounge';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-detail-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './table-detail-modal.html'
})
export class TableDetailModal {


  table = input.required<TablePositionResponse>();

  close = output<void>();
  sizeChanged = output<{ tableId: string, width: number, height: number }>();
  removed = output<string>();

  currentWidth: number = 200;
  currentHeight: number = 80;

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
    if (this.currentWidth > 120) {
      this.currentWidth -= 20;
      this.onSizeChange();
    }
  }

  increaseHeight(): void {
    if (this.currentHeight < 120) {
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

  onRemove(): void {
    if (confirm(`¿Estás seguro que deseas eliminar la mesa ${this.table().diningTableNumber} del salón?`)) {
      this.removed.emit(this.table().diningTableId);
    }
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
}
