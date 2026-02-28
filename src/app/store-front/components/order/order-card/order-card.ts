import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ChevronDown,
  Clock,
  CircleCheckBig,
  CircleX,
  Package,
  User,
  Info,
  CookingPot,
  HandPlatter,
  CheckCheck,
  BanknoteArrowUp,
} from 'lucide-angular';
import { OrderResponse } from '../../../models/order.interface';
import {
  ORDER_STATUS_UI,
  OrderStatus,
  toneToBadgeClass,
} from '../../../../shared/models/status-ui';
import { PaymentStatus } from '../../../models/payment.interface';
import { NavigationService } from '../../../../shared/services/navigation.service';
@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-card.html',
})
export class OrderCardComponent {
  @Input({ required: true }) order!: OrderResponse;
  @Input() isMine = false;
  @Output() selected = new EventEmitter<{
    orderId: string;
    isSelected: boolean;
  }>();
  @Output() cancel = new EventEmitter<string>();
  @Output() viewPayment = new EventEmitter<string>();

  private navigation = inject(NavigationService);

  readonly ChevronDown = ChevronDown;
  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;
  readonly User = User;
  readonly Info = Info;
  readonly CheckCheck = CheckCheck;
  readonly CookingPot = CookingPot;
  readonly HandPlatter = HandPlatter;
  readonly BanknoteArrowUp = BanknoteArrowUp;

  private readonly CANCELABLE_STATUSES = new Set(['PENDING', 'APPROVED']);

  isExpanded = signal(false);
  isSelected = signal(false);
  isPaid = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order']) {
      const payment = this.order.payment;

      const paid = !!payment && payment.status === PaymentStatus.COMPLETED;

      this.isPaid.set(paid);
      if (String(this.order.status) === 'CANCELLED') {
        this.isExpanded.set(false);
        this.isSelected.set(false);
      }
    }
  }

  toggleExpand(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  onSelectionChange(event: Event): void {
    event.stopPropagation();

    const input = event.target as HTMLInputElement;
    this.isSelected.set(input.checked);

    this.selected.emit({
      orderId: this.order.publicId,
      isSelected: this.isSelected(),
    });
  }

  get orderUi() {
    const st = this.order.status as OrderStatus;
    return ORDER_STATUS_UI[st] ?? { label: this.order.status, tone: 'neutral' as const };
  }

  badgeClass(): string {
    return 'badge badge-sm ' + toneToBadgeClass(this.orderUi.tone);
  }

  canCancel(): boolean {
    if (!this.isMine) return false;
    
    const statusOk = this.CANCELABLE_STATUSES.has(String(this.order.status));
    if (!statusOk) return false;

    const payStatus = this.order.payment?.status;
    const hasActivePayment = !!payStatus && payStatus !== 'CANCELLED';

    return !hasActivePayment;
  }

  getCancelState():
    | { type: 'CAN_CANCEL' }
    | { type: 'HAS_PAYMENT' }
    | { type: 'INVALID_STATUS' }
    | { type: 'NOT_MINE' } {
    if (!this.isMine) return { type: 'NOT_MINE' };
    
    const statusOk = this.CANCELABLE_STATUSES.has(String(this.order.status));
    if (!statusOk) return { type: 'INVALID_STATUS' };

    const payStatus = this.order.payment?.status;
    const hasActivePayment = !!payStatus && payStatus !== 'CANCELLED';
    if (hasActivePayment) return { type: 'HAS_PAYMENT' };

    return { type: 'CAN_CANCEL' };
  }

  onViewPayment(paymentId: string | undefined) {
    if (!paymentId) return;
    this.navigation.navigateToPayments({
      section: 'history',
      highlight: paymentId,
    });
  }
}
