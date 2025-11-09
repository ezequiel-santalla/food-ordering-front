import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartView } from "./cart-view/cart-view";
import { MyOrders } from "./my-orders/my-orders";
import { TableOrders } from "./table-orders/table-orders";
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { TableSummaryComponent } from './table-summary/table-summary';
// 1. Importar el nuevo componente de resumen

type OrderView = 'cart' | 'mine' | 'table';

@Component({
  selector: 'app-order-tabs',
  standalone: true,
  // 2. Añadir TableSummaryComponent a los imports
  imports: [CommonModule, CartView, MyOrders, TableOrders],
  templateUrl: './order-tabs.html'
})
export class OrderTabs {
  cartService = inject(CartService);
  orderService = inject(OrderService);

  activeTab = signal<OrderView>('cart');

  // --- CONTADORES PARA PESTAÑAS ---
  cartCount = computed(() => this.cartService.items().length);
  tableCount = computed(() => this.orderService.tableOrders().length);
  myCount = computed(() => this.orderService.myOrders().length);

  // 3. ¡Toda la lógica del resumen desaparece de aquí!

  setTab(tab: OrderView) {
    this.activeTab.set(tab);
  }
}