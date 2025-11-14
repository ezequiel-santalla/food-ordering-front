import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertCircle, Armchair, Ban, CheckCircle2, ChefHat, Clock, LucideAngularModule, ShoppingBag, User, Utensils, X } from 'lucide-angular';
import { OrderResponse, OrderStatus } from '../../../models/order';


@Component({
  selector: 'app-order-detail-modal',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-detail.html'
})
export class OrderDetail {
  @Input({ required: true }) order!: OrderResponse;

  @Output() close = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<{
    orderId: string;
    newStatus: OrderStatus
  }>();

  readonly X = X;
  readonly User = User;
  readonly Armchair = Armchair;
  readonly Clock = Clock;
  readonly ShoppingBag = ShoppingBag;
  readonly AlertCircle = AlertCircle;
  readonly ChefHat = ChefHat;
  readonly Ban = Ban;
  readonly CheckCircle2 = CheckCircle2;
  readonly Utensils = Utensils;

  updateStatus(newStatus: OrderStatus): void {
    this.statusChanged.emit({
      orderId: this.order.publicId,
      newStatus
    });
    this.close.emit();
  }

  confirmCancel(): void {
    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      this.updateStatus('CANCELLED');
    }
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'APPROVED':
        return 'badge-primary';
      case 'IN_PROGRESS':
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

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
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

  formatOrderDate(date: string | Date): string {
    const orderDate = new Date(date);
    return orderDate.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
