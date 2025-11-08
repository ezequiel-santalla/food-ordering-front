import { Component, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { OrderService } from '../../../services/order.service';
import { TableSessionService } from '../../../services/table-session.service';

@Component({
  selector: 'app-table-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './table-summary.html',
})
export class TableSummaryComponent {

  private orderService = inject(OrderService);
  private tableSessionService = inject(TableSessionService);

  // --- Señales para el Resumen ---
  
  // Total de pedidos en la mesa (ej. "3")
  totalPedidos = computed(() => this.orderService.tableOrders().length);

  // Conteo de personas (ej. "3/4")
  participantCount = computed(() => this.tableSessionService.tableSessionInfo().participantCount);
  tableCapacity = computed(() => {
    const capacity = this.tableSessionService.tableSessionInfo().tableCapacity;
    return capacity > 0 ? capacity : this.participantCount(); 
  });

  // Total gastado (Suma de TODOS los pedidos)
  totalGastado = computed(() => {
    return this.orderService.tableOrders().reduce((sum, order) => sum + order.totalPrice, 0);
  });

  // Resto a pagar (Suma de pedidos NO completados/pagados)
  restoAPagar = computed(() => {
    return this.orderService.tableOrders()
      .filter(order => order.status !== 'COMPLETED')
      .reduce((sum, order) => sum + order.totalPrice, 0);
  });
}