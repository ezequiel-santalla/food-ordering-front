import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-item-card',
  imports: [NgClass, RouterLink],
  templateUrl: './menu-item-card.html'
})
export class MenuItemCard {

  image = input.required<string>();
  name = input.required<string>();
  description = input.required<string>();
  price = input<number>();

  layout = input<'vertical' | 'horizontal'>('vertical');
}
