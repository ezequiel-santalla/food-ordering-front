import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaymentResponse, PaymentStatus } from '../../../models/payments';
import { Check, CreditCard, DollarSign, LucideAngularModule, X } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-card',
  imports: [LucideAngularModule,CommonModule],
  templateUrl: './payment-card.html',
  styleUrl: './payment-card.css'
})
export class PaymentCard {

  @Input({ required: true }) payment!: PaymentResponse;
  @Input() tableNumber?: number;

  @Output() statusChanged = new EventEmitter<{
    paymentId: string;
    newStatus: PaymentStatus;
  }>();
  @Output() viewDetails = new EventEmitter<string>();

  readonly CreditCard = CreditCard;
  readonly DollarSign = DollarSign;
  readonly Check = Check;
  readonly X = X;

  changeStatus(event: Event, newStatus: PaymentStatus): void {
    event.stopPropagation();
    this.statusChanged.emit({
      paymentId: this.payment.publicId,
      newStatus
    });
  }

  getStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getStatusText(status: PaymentStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'EFECTIVO':
        return 'Efectivo';
      case 'TARJETA_DEBITO':
        return 'Tarjeta de Débito';
      case 'TARJETA_CREDITO':
        return 'Tarjeta de Crédito';
      case 'TRANSFERENCIA':
        return 'Transferencia';
      default:
        return method;
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'EFECTIVO':
        return '💵';
      case 'TARJETA_DEBITO':
      case 'TARJETA_CREDITO':
        return '💳';
      case 'TRANSFERENCIA':
        return '🏦';
      default:
        return '💰';
    }
  }

  formatDate(date: string): string {
    const paymentDate = new Date(date);
    return paymentDate.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentId(): string {
    return this.payment.publicId.split('-')[0].toUpperCase();
  }


}
