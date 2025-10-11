import { Component, inject, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionRoutesService } from '../../services/session-routes.service';

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

  sessionRoutesService = inject(SessionRoutesService);
}
