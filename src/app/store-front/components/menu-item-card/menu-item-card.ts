import { Component, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { SessionRoutesService } from '../../services/session-routes.service';

@Component({
  selector: 'app-menu-item-card',
  imports: [NgClass],
  templateUrl: './menu-item-card.html'
})
export class MenuItemCard {

  sessionRoutesService = inject(SessionRoutesService);

  image = input.required<string>();
  name = input.required<string>();
  description = input.required<string>();
  price = input.required<number>();

  layout = input<'vertical' | 'horizontal'>('vertical');

  select = output<void>();

  // Método de debug
  onCardClick() {
    console.log('Card clicked! Product:', this.name());
    this.select.emit();
  }
}
