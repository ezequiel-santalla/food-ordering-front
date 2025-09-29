import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, House, Menu, ShoppingCart, CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './footer.html'
})
export class Footer {
  readonly House = House;
  readonly Menu = Menu;
  readonly ShoppingCart = ShoppingCart;
  readonly CreditCard = CreditCard;
}
