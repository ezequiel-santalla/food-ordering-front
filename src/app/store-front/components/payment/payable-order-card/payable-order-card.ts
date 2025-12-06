import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircleCheck, User, LucideAngularModule, AlertCircle } from 'lucide-angular';
import { OrderResponse } from '../../../models/order.interface';

@Component({
  selector: 'app-payable-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './payable-order-card.html',
})
export class PayableOrderCardComponent {
  @Input() order!: OrderResponse;
  @Input() selected = false;

  @Output() selectionChanged = new EventEmitter<{ orderId: string; selected: boolean }>();

  readonly User = User;
  readonly CircleCheck = CircleCheck;
  readonly AlertCircle = AlertCircle;

  toggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectionChanged.emit({
      orderId: this.order.publicId,
      selected: checked,
    });
  }

  /** Mapea los estados de pago a estilos legibles por el usuario */
  getPaymentStatusLabel() {
    if (!this.order.payment) return null;

    const status = this.order.payment.status;

    const map: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: 'Pendiente', color: 'text-amber-600', icon: AlertCircle },
      WAITING_WAITER: { label: 'Esperando al mozo', color: 'text-blue-600', icon: AlertCircle },
      PENDING_MP: { label: 'Pago iniciado (MP)', color: 'text-sky-600', icon: CircleCheck },
      COMPLETED: { label: 'Pagado', color: 'text-green-600', icon: CircleCheck },
      FAILED: { label: 'Fallido', color: 'text-red-600', icon: AlertCircle },
      CANCELLED: { label: 'Cancelado', color: 'text-gray-500', icon: AlertCircle },
    };

    return map[status] ?? {
      label: status,
      color: 'text-gray-600',
      icon: CircleCheck,
    };
  }
}
