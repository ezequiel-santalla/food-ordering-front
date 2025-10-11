import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, House, Menu, ShoppingCart, CreditCard, HandPlatter } from 'lucide-angular';
import { NavigationService } from '../../../shared/services/navigation.service';
import { SessionRoutesService } from '../../services/session-routes.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './footer.html'
})
export class Footer {
  readonly House = House;
  readonly Menu = Menu;
  readonly ShoppingCart = ShoppingCart;
  readonly HandPlatter = HandPlatter;
  readonly CreditCard = CreditCard;

  sessionRoutesService = inject(SessionRoutesService);
}
