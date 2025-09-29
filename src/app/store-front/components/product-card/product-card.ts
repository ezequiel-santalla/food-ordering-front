import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-product-card',
  imports: [NgClass],
  templateUrl: './product-card.html'
})
export class ProductCard {

  image = input.required<string>();
  title = input.required<string>();
  description = input.required<string>();
  price = input.required<number>();

  layout = input<'vertical' | 'horizontal'>('vertical');
}
