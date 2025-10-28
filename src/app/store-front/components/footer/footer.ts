import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, House, Menu, ShoppingCart, CreditCard, HandPlatter } from 'lucide-angular';
import { SessionRoutesService } from '../../services/session-routes.service';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './footer.html',
})
export class Footer {
  readonly House = House;
  readonly Menu = Menu;
  readonly ShoppingCart = ShoppingCart;
  readonly HandPlatter = HandPlatter;
  readonly CreditCard = CreditCard;

  sessionRoutesService = inject(SessionRoutesService);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);

  myOrdersCount = computed(() => {
    return this.orderService.myOrders().length;
  });

  itemsInCartCount = computed(() => this.cartService.items().length);
}
