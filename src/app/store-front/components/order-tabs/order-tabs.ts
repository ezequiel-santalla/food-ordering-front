import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartView } from "./cart-view/cart-view";
import { MyOrders } from "./my-orders/my-orders";
import { TableOrders } from "./table-orders/table-orders";
import { CartService } from '../../services/cart-service';
import { OrderService } from '../../services/order-service';

type OrderView = 'cart' | 'mine' | 'table';

@Component({
  selector: 'app-order-tabs',
  standalone: true,
  
  imports: [CommonModule, CartView, MyOrders, TableOrders],
  templateUrl: './order-tabs.html'
})
export class OrderTabs {
  cartService = inject(CartService);
  orderService = inject(OrderService);

  activeTab = signal<OrderView>('cart');

  cartCount = computed(() => this.cartService.items().length);
  tableCount = computed(() => this.orderService.tableOrders().length);
  myCount = computed(() => this.orderService.myOrders().length);

  setTab(tab: OrderView) {
    this.activeTab.set(tab);
  }
}
