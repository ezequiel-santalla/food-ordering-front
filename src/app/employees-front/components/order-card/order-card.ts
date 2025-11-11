import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertCircle, Armchair, Check, ChefHat, Clock, LucideAngularModule, User, Utensils, X } from 'lucide-angular';
import { OrderResponse, OrderStatus } from '../../models/orders';

@Component({
  selector: 'app-order-card',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-card.html',
  styleUrl: './order-card.css'
})
export class OrderCard {

   @Input({ required: true }) order!: OrderResponse;

  @Output() statusChanged = new EventEmitter<{
    orderId: string;
    newStatus: OrderStatus
  }>();
  @Output() viewDetails = new EventEmitter<string>();

  readonly User = User;
  readonly Armchair = Armchair;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly ChefHat = ChefHat;
  readonly X = X;
  readonly Check = Check;
  readonly Utensils = Utensils;

  changeStatus(event: Event, newStatus: OrderStatus): void {
    event.stopPropagation();
    this.statusChanged.emit({
      orderId: this.order.publicId,
      newStatus
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'APPROVED':
        return 'badge-info';
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
      case 'IN_PROGRESS':
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

  getTimeAgo(orderDate: string | Date): string {
    const now = new Date();
    const order = new Date(orderDate);
    const diffMs = now.getTime() - order.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins === 1) return 'Hace 1 min';
    if (diffMins < 60) return `Hace ${diffMins} mins`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;

    return order.toLocaleDateString();
  }
}
