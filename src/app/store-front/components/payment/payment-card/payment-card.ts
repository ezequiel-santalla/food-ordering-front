import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentResponseDto, PaymentStatus } from '../../../models/payment.interface';

@Component({
  selector: 'app-payment-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-card.html'
})
export class PaymentCardComponent {

  @Input() payment!: PaymentResponseDto;
  @Output() cancel = new EventEmitter<string>();

  isOpen = false;

  toggle() {
    this.isOpen = !this.isOpen;
  }

  getStatusLabel(status: PaymentStatus) {
    return {
      PENDING: { label: 'Pendiente', color: 'text-amber-600' },
      COMPLETED: { label: 'Completado', color: 'text-green-600' },
      CANCELLED: { label: 'Cancelado', color: 'text-gray-500' },
      FAILED: { label: 'Fallido', color: 'text-red-600' }
    }[status];
  }
}
