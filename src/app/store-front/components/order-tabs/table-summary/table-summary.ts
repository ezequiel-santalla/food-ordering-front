import { Component, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { OrderService } from '../../../services/order-service';
import { TableSessionService } from '../../../services/table-session-service';
import {
  BanknoteX,
  Coins,
  Hash,
  LucideAngularModule,
  PersonStanding,
  UsersRound,
} from 'lucide-angular';
import {
  PaymentResponseDto,
  PaymentStatus,
} from '../../../models/payment.interface';
import { Subscription } from 'rxjs';
import { ServerSentEventsService } from '../../../../shared/services/server-sent-events.service';

@Component({
  selector: 'app-table-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, LucideAngularModule],
  templateUrl: './table-summary.html',
})
export class TableSummaryComponent {
  private orderService = inject(OrderService);
  private tableSessionService = inject(TableSessionService);
  private sseEvent = inject(ServerSentEventsService);

  private sseSubscription: Subscription | undefined;

  readonly UsersRound = UsersRound;
  readonly PersonStanding = PersonStanding;
  readonly Hash = Hash;
  readonly Coins = Coins;
  readonly BanknoteX = BanknoteX;

  // --- Señales para el Resumen ---

  tableNumber = computed(
    () => this.tableSessionService.tableSessionInfo().tableNumber
  );

  // Total de pedidos en la mesa (ej. "3")
  totalOrders = computed(() => this.orderService.tableOrders().length);

  // Conteo de personas (ej. "3/4")
  participantCount = computed(
    () => this.tableSessionService.tableSessionInfo().participantCount
  );
  tableCapacity = computed(() => {
    const capacity = this.tableSessionService.tableSessionInfo().tableCapacity;
    return capacity ?? null;  
});

  // Total gastado (Suma de TODOS los pedidos)
  totalSpent = computed(() => {
    return this.orderService
      .tableOrders()
      .reduce((sum, order) => sum + order.totalPrice, 0);
  });

  remainingToPay = computed(() =>
    this.orderService
      .tableOrders()
      .filter((order) => !!!order.payment)
      //.filter((order) => !(order.payment?.status === PaymentStatus.COMPLETED))
      .reduce((sum, order) => sum + order.totalPrice, 0)
  );
}
