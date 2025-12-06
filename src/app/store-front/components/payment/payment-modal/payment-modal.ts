import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  PaymentMethod,
  PaymentOrderView,
} from '../../../models/payment.interface';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './payment-modal.html',
})
export class PaymentModalComponent {
  readonly PaymentMethod = PaymentMethod;

  @ViewChild('dialog') dialog?: ElementRef<HTMLDialogElement>;

  @Input() totalToPay = 0;
  @Input() selectedOrders: PaymentOrderView[] = [];
  @Input() paymentMethods: { value: PaymentMethod; label: string; icon: any }[] = [];
  @Input() selectedPaymentMethod: PaymentMethod = PaymentMethod.CASH;
  @Input() isProcessingPayment = false;

  @Output() paymentMethodChange = new EventEmitter<PaymentMethod>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() mercadoPagoSelected = new EventEmitter<void>();

  open() {
    this.dialog?.nativeElement.showModal();
  }

  close() {
    this.dialog?.nativeElement.close();
  }

  onChangeMethod(method: PaymentMethod) {
    this.paymentMethodChange.emit(method);
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
    this.close();
  }

  onSelectMercadoPago() {
    this.paymentMethodChange.emit(PaymentMethod.MOBILE_PAYMENT);
    this.mercadoPagoSelected.emit();
  }
}
