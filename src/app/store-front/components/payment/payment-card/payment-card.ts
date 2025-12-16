import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getPaymentStatusUi, toneToTextClass } from '../../../../shared/models/status-ui';
import { LucideAngularModule } from 'lucide-angular';
import { PaymentResponseDto } from '../../../models/payment.interface';

@Component({
  selector: 'app-payment-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './payment-card.html'
})
export class PaymentCardComponent {

  @Input() payment!: PaymentResponseDto;
  @Output() cancel = new EventEmitter<string>();

  isOpen = false;

  toggle() {
    this.isOpen = !this.isOpen;
  }

  ui = computed(() => getPaymentStatusUi(this.payment.status));

  statusTextClass = computed(() => toneToTextClass(this.ui().tone));
}
