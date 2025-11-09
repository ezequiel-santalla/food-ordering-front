import { Component, inject, computed } from '@angular/core';
import { OrderService } from '../../../services/order.service';
import { CurrencyPipe, CommonModule } from '@angular/common'; // <-- 1. Importa CommonModule
import {
  LucideAngularModule,
  Clock,
  CircleCheckBig,
  CircleX,
  Package,
} from 'lucide-angular';
import { TableSessionService } from '../../../services/table-session.service';
import { OrderCardComponent } from '../Order-card/order-card';

@Component({
  selector: 'app-table-orders',
  standalone: true, // Asumo que es standalone
  imports: [
    CommonModule, // <-- 3. Añade CommonModule
    LucideAngularModule, 
    OrderCardComponent// <-- 4. Añade OrderCardComponent
  ],
  templateUrl: './table-orders.html',
})
export class TableOrders {
  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;

  private orderService = inject(OrderService);
  private tableSessionService = inject(TableSessionService);

  orders = this.orderService.tableOrders;
  isLoading = this.orderService.isLoading;
  error = this.orderService.error;

  tableNumber = computed(
    () => this.tableSessionService.tableSessionInfo().tableNumber
  );

  getTotalTable(): number {
    return this.orders().reduce((total, order) => total + order.totalPrice, 0);
  }

  // 5. Esta lógica ya no es necesaria aquí (se fue al OrderCardComponent)
  /*
  getStatusBadgeClass(status: string): string { ... }
  getStatusText(status: string): string { ... }
  getStatusIcon(status: string) { ... }
  */

  // 6. (Opcional) Puedes añadir el handler para la selección
  onOrderSelected(event: {orderId: string, isSelected: boolean}) {
    console.log(`Orden de mesa ${event.orderId} seleccionada: ${event.isSelected}`);
    // Aquí puedes añadir los IDs a un array para acciones (ej. pagar seleccionados)
  }
}