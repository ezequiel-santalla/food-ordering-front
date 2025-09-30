import { Component, input } from '@angular/core';
import { MenuItemCard } from '../menu-item-card/menu-item-card';

@Component({
  selector: 'app-menu',
  imports: [MenuItemCard],
  templateUrl: './menu.html'
})
export class Menu {

  menu = input.required<any[]>();
}
