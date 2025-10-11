import { Component, input } from '@angular/core';
import { Menu } from '../../../store-front/models/menu.interface';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-food-venue-menu',
  imports: [DecimalPipe],
  templateUrl: './food-venue-menu.component.html',
})
export class FoodVenueMenuComponent {

  menu = input.required<Menu>();
}
