import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircleCheck, User, LucideAngularModule, AlertCircle } from 'lucide-angular';
import { OrderResponse } from '../../../models/order.interface';
import { getPaymentStatusUi, toneToTextClass } from '../../../../shared/models/status-ui';

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

 canSelectForPayment = computed(() => {
    const p = this.order?.payment;
    return !p || p.status === 'CANCELLED';
  });

  paymentUi = computed(() => {
    const p = this.order?.payment;
    return p ? getPaymentStatusUi(p.status) : null;
  });

  paymentTextClass = computed(() => {
    const ui = this.paymentUi();
    return ui ? toneToTextClass(ui.tone) : '';
  });

  onToggleCheckbox(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectionChanged.emit({ orderId: this.order.publicId, selected: checked });
  }
}
