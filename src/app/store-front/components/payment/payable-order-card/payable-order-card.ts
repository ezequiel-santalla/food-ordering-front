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

  private nowMs = signal(Date.now());
  private timer = setInterval(() => this.nowMs.set(Date.now()), 1000);

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

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

  showCountdown = computed(() => {
    const p = this.order?.payment;
    return !!p && p.status === 'INITIATED' && p.expiresAt != null;
  });

  remainingSeconds = computed(() => {
    this.nowMs();
    const exp = (this.order?.payment as any)?.expiresAt;
    if (!exp) return null;

    const expMs = new Date(exp).getTime();
    const diff = expMs - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  });

  remainingLabel = computed(() => {
    const s = this.remainingSeconds();
    if (s == null) return null;

    if (s >= 60) {
      const m = Math.ceil(s / 60);
      return `Quedan ${m} min`;
    }

    if (s <= 5) return `${s}`;

    return `Quedan ${s} s`;
  });

  onToggleCheckbox(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectionChanged.emit({ orderId: this.order.publicId, selected: checked });
  }
}
