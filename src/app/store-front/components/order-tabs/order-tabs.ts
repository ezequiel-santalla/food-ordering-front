import { Component, computed, inject, signal } from '@angular/core';
import { CartView } from "./cart-view/cart-view";
import { TableOrders } from "./table-orders/table-orders";
import { MyOrders } from "./my-orders/my-orders";
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-tabs',
  imports: [CartView, TableOrders, MyOrders],
  templateUrl: './order-tabs.html'
})
export class OrderTabs {

  cartService = inject(CartService);
  orderService = inject(OrderService);

  activeTab = signal<'cart' | 'table' | 'mine'>('cart');

  cartCount = computed(() => this.cartService.items().length);
  tableCount = signal(0);
  myCount = signal(0);

  constructor() {
    this.loadCounts();
  }

  setTab(tab: 'cart' | 'table' | 'mine') {
    this.activeTab.set(tab);

    if (tab === 'mine' || tab === 'table') {
      this.loadCounts();
    }
  }

  private loadCounts() {
    this.orderService.getCurrentParticipantOrders().subscribe({
      next: (paginatedResponse) => {
        const myOrders = paginatedResponse.content;
        console.log('🔍 OrderTabs - Mis pedidos cargados:', myOrders.length);
        this.myCount.set(myOrders.length);
      },
      error: () => {
        this.myCount.set(0);
      }
    });

    this.orderService.getCurrentSessionOrders().subscribe({
      next: (paginatedResponse) => {
        const tableOrders = paginatedResponse.content;
        console.log('🔍 OrderTabs - Pedidos de mesa cargados:', tableOrders.length);
        this.tableCount.set(tableOrders.length);
      },
      error: () => {
        this.tableCount.set(0);
      }
    });
  }
}
