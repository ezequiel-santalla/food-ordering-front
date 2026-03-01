import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Star, Flame, Heart } from 'lucide-angular';
import { Product } from '../../../models/menu.interface';
import { CartService } from '../../../services/cart-service';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { MenuService } from '../../../services/menu-service';

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
  private menuService = inject(MenuService);

  readonly Star = Star;
  readonly Flame = Flame;
  readonly Heart = Heart;

  select = output<Product>();
  add = output<Product>();;

  onActionClick(event: Event) {
    event.stopPropagation();

    const productId = this.product().publicId;
    if (!productId) return;

    this.menuService.getFullProductByPublicId(productId).subscribe({
      next: (fullProduct) => {
        const productToAdd = fullProduct || this.product();

        this.cartService.addItem(productToAdd, 1, '');
        
        this.sweetAlert.showToast(
          'top-end',
          'success',
          `Agregaste ${productToAdd.name} a tu orden.`
        );
      }
    });
  }
}
