import { Component, computed, inject, signal } from '@angular/core';
import { CartView } from "./cart-view/cart-view";
import { MyOrders } from "./my-orders/my-orders";
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { TableOrders } from "./table-orders/table-orders";

@Component({
  selector: 'app-order-tabs',
  imports: [CartView, MyOrders, TableOrders],
  templateUrl: './order-tabs.html'
})
export class OrderTabs {

  cartService = inject(CartService);
  orderService = inject(OrderService); // 👈 2. Inyecta el servicio de estado

  activeTab = signal<'cart' | 'table' | 'mine'>('cart');

  // --- CONTADORES REACTIVOS ---
  cartCount = computed(() => this.cartService.items().length);
  
  // tableCount y myCount ahora leen DIRECTAMENTE del OrderService
  // Se actualizarán solos cuando el SSE reciba un evento.
  tableCount = computed(() => this.orderService.tableOrders().length); // ✅ Reactivo
  myCount = computed(() => this.orderService.myOrders().length); // ✅ Reactivo

  setTab(tab: 'cart' | 'table' | 'mine') {
    this.activeTab.set(tab);
  }
}