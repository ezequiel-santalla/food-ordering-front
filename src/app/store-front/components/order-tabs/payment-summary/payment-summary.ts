import { Component, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { OrderService } from '../../../services/order-service';
import { LucideAngularModule, Coins, BanknoteX } from 'lucide-angular';
import { PaymentStatus } from '../../../models/payment.interface';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, LucideAngularModule],
  templateUrl: './payment-summary.html',
})
export class PaymenSummaryComponent {
  private orderService = inject(OrderService);

  totalSpent = computed(() =>
    this.orderService.tableOrders().reduce((sum, o) => sum + o.totalPrice, 0)
  );

  remainingToPay = computed(() =>
    this.orderService
      .tableOrders()
      .filter(o => o.payment?.status !== PaymentStatus.COMPLETED)
      .reduce((sum, o) => sum + o.totalPrice, 0)
  );

  readonly Coins = Coins;
  readonly BanknoteX = BanknoteX;
}
