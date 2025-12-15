import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Star, Flame, Heart } from 'lucide-angular';
import { Product } from '../../../models/menu.interface';
import { CartService } from '../../../services/cart-service';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-menu-highlight-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './menu-highlight-card.html',
})
export class MenuHighlightCard {
  product = input.required<Product>();

  variant = input<'premium' | 'pop' | 'minimal'>('premium');

  private cartService = inject(CartService);
  private sweetAlert = inject(SweetAlertService);

  readonly Star = Star;
  readonly Flame = Flame;
  readonly Heart = Heart;

  select = output<Product>();
  add = output<Product>();

  onActionClick(event: Event) {
    event.stopPropagation();

    this.cartService.addItem(this.product(), 1, null);

    this.sweetAlert.showSuccess(
      '¡Agregado!',
      `${this.product().name} fue añadido a tu orden.`,
      1500
    );
  }
}
