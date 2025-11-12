import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule,X,
  Ban,
  Check,
  Clock,
  Users,
  ShoppingBag  } from 'lucide-angular';
import { OrderResponse, OrderStatus } from '../../../models/order';
import { DiningTableStatus, TablePositionResponse } from '../../../models/lounge';

@Component({
  selector: 'app-table-detail-modal',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './table-detail-modal.html',
})
export class TableDetailModal {

@Input({ required: true }) table!: TablePositionResponse;
  @Input({ required: true }) orders: OrderResponse[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<{
    tableId: string;
    newStatus: DiningTableStatus
  }>();
  @Output() orderStatusChanged = new EventEmitter<{
    orderId: string;
    newStatus: OrderStatus
  }>();

  readonly X = X;
  readonly Ban = Ban;
  readonly Check = Check;
  readonly Clock = Clock;
  readonly Users = Users;
  readonly ShoppingBag = ShoppingBag;

  onBackdropClick(event: MouseEvent): void {
    this.close.emit();
  }

  // ===================================
  // Table Status Management
  // ===================================

  markOutOfService(): void {
    this.statusChanged.emit({
      tableId: this.table.diningTableId,
      newStatus: DiningTableStatus.OUT_OF_SERVICE
    });
  }

  markAvailable(): void {
    this.statusChanged.emit({
      tableId: this.table.diningTableId,
      newStatus: DiningTableStatus.AVAILABLE
    });
  }

  markWaitingReset(): void {
    this.statusChanged.emit({
      tableId: this.table.diningTableId,
      newStatus: DiningTableStatus.WAITING_RESET
    });
  }

  viewSessionDetails(): void {
    // Navegar a la vista de sesión o abrir otro modal
    console.log('Ver detalles de sesión para mesa:', this.table.diningTableNumber);
  }

  // ===================================
  // Order Status Management
  // ===================================

  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    this.orderStatusChanged.emit({ orderId, newStatus });
  }

  // ===================================
  // Status Display Helpers
  // ===================================

  getStatusBadgeClass(status: DiningTableStatus): string {
    switch (status) {
      case DiningTableStatus.AVAILABLE:
        return 'badge-success';
      case DiningTableStatus.IN_SESSION:
        return 'badge-info';
      case DiningTableStatus.COMPLETE:
        return 'badge-warning';
      case DiningTableStatus.WAITING_RESET:
        return 'badge-warning';
      case DiningTableStatus.OUT_OF_SERVICE:
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getStatusText(status: DiningTableStatus): string {
    switch (status) {
      case DiningTableStatus.AVAILABLE:
        return 'Disponible';
      case DiningTableStatus.IN_SESSION:
        return 'En Sesión';
      case DiningTableStatus.COMPLETE:
        return 'Completa';
      case DiningTableStatus.WAITING_RESET:
        return 'Esperando Limpieza';
      case DiningTableStatus.OUT_OF_SERVICE:
        return 'Fuera de Servicio';
      default:
        return status;
    }
  }

  getOrderStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'IN_PREPARATION':
        return 'badge-info';
      case 'COMPLETED':
        return 'badge-success';
      case 'SERVED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getOrderStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PREPARATION':
        return 'En Preparación';
      case 'COMPLETED':
        return 'Completado';
      case 'SERVED':
        return 'Servido';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

}
