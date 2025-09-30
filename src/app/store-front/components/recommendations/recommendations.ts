import { Component, input } from '@angular/core';
import { MenuItemCard } from '../menu-item-card/menu-item-card';

@Component({
  selector: 'app-recommendations',
  imports: [MenuItemCard],
  templateUrl: './recommendations.html'
})
export class Recommendations {

  menu = input.required<any[]>();
}
