import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircleCheck, LucideAngularModule, User } from 'lucide-angular';
import { OrderResponse } from '../../models/order.interface';

@Component({
  selector: 'app-payable-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './payable-order-card.html',
})
export class PayableOrderCardComponent {
  @Input() order!: OrderResponse;
  @Input() selected = false;
  @Input() disabled = false;
  @Input() paid = false;

  @Output() selectionChanged = new EventEmitter<{
    orderId: string;
    selected: boolean;
  }>();

  readonly User = User;
  readonly CircleCheck = CircleCheck;

  toggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    this.selectionChanged.emit({
      orderId: this.order.publicId,
      selected: checked,
    });
  }

  getPaymentStatusLabel() {
    if (!this.order.payment) return null;

    const status = this.order.payment.status;

    switch (status) {
      case 'PENDING':
        return { label: 'Pendiente', color: 'text-amber-600' };
      case 'COMPLETED':
        return { label: 'Completado', color: 'text-green-600' };
      case 'FAILED':
        return { label: 'Fallido', color: 'text-red-600' };
      case 'CANCELLED':
        return { label: 'Cancelado', color: 'text-gray-500' };
      default:
        return { label: status, color: 'text-gray-600' };
    }
  }
}
