import { Component, inject, computed } from '@angular/core';
import { OrderService } from '../../../services/order.service';
import { CurrencyPipe } from '@angular/common';
import {
  LucideAngularModule,
  Clock,
  CircleCheckBig,
  CircleX,
  Package,
} from 'lucide-angular';
import { TableSessionService } from '../../../services/table-session.service';

@Component({
  selector: 'app-table-orders',
  imports: [LucideAngularModule, CurrencyPipe],
  templateUrl: './table-orders.html',
})
export class TableOrders {
  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;

  private orderService = inject(OrderService);
  private tableSessionService = inject(TableSessionService);

  orders = this.orderService.tableOrders; // ✅ Reactivo
  isLoading = this.orderService.isLoading; // ✅ Reactivo
  error = this.orderService.error; // ✅ Reactivo

  tableNumber = computed(
    () => this.tableSessionService.tableSessionInfo().tableNumber
  );

  getTotalTable(): number {
    return this.orders().reduce((total, order) => total + order.totalPrice, 0);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'PENDING':
        return this.Clock;
      case 'COMPLETED':
        return this.CircleCheckBig;
      case 'CANCELLED':
        return this.CircleX;
      default:
        return this.Package;
    }
  }
}
