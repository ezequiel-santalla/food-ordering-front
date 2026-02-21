import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { OrderResponse } from '../../../models/order.interface';
import { getPaymentStatusUi, toneToTextClass } from '../../../../shared/models/status-ui';

@Component({
  selector: 'app-payable-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './payable-order-card.html',
})
export class PayableOrderCardComponent {

  private _order = signal<OrderResponse | null>(null);

  @Input() set order(value: OrderResponse) {
    this._order.set(value);
  }
  get order(): OrderResponse {
    return this._order()!;
  }

  @Input() selected = false;
  @Output() selectionChanged = new EventEmitter<{ orderId: string; selected: boolean }>();

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
