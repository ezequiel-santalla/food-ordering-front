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
  price = input.required<number>();

  layout = input<'vertical' | 'horizontal'>('vertical');

  getProductRoute() {
    // trim + toLowerCase para que coincida con el backend
    const normalizedName = this.name().trim().toLowerCase();
    return ['/session/menu', normalizedName];
  }
}
