import { Component, computed, inject } from '@angular/core';
import { CartView } from "./cart-view/cart-view";
import { TableOrders } from "./table-orders/table-orders";
import { MyOrders } from "./my-orders/my-orders";
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order-tabs',
  imports: [CartView, TableOrders, MyOrders],
  templateUrl: './order-tabs.html'
})
export class OrderTabs {

  cartService = inject(CartService);

  activeTab = 'cart';

  cartCount = computed(() => this.cartService.items().length);
  tableCount = 0;
  myCount = 0;

  setTab(tab: 'cart' | 'table' | 'mine') {
    this.activeTab = tab;
  }
}
