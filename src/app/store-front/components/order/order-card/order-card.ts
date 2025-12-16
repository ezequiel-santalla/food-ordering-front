import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  SimpleChanges,
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
@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-card.html',
})
export class OrderCardComponent {
  @Input({ required: true }) order!: OrderResponse;
  @Output() selected = new EventEmitter<{
    orderId: string;
    isSelected: boolean;
  }>();

  readonly ChevronDown = ChevronDown;
  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;
  readonly User = User;
  readonly CheckCheck = CheckCheck;
  readonly CookingPot = CookingPot;
  readonly HandPlatter = HandPlatter;
  readonly BanknoteArrowUp = BanknoteArrowUp;

  isExpanded = signal(false);
  isSelected = signal(false);
  isPaid = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order']) {
      const payment = this.order.payment;

      const paid = !!payment;

      //const paid = !!payment && payment.status === PaymentStatus.COMPLETED;

      this.isPaid.set(paid);
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
}
