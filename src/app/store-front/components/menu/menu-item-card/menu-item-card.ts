import { Component, computed, inject, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, Minus, Star } from 'lucide-angular';
import { Product } from '../../../models/menu.interface';
import { CartService } from '../../../services/cart-service';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-menu-item-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './menu-item-card.html',
})
export class MenuItemCard {
  @Input({ required: true }) product!: Product;
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';

  private cartService = inject(CartService);
  private sweetAlert = inject(SweetAlertService);

  readonly Plus = Plus;
  readonly Minus = Minus;
  readonly Star = Star;

  select = output<Product>();

  // Cantidad total de este producto en el carrito (suma todas las variantes)
  quantity = computed(() => {
    const items = this.cartService.items();
    return items
      .filter(i => i.productName === this.product.name)
      .reduce((sum, i) => sum + i.quantity, 0);
  });

  increaseQuantity(ev?: Event) {
    ev?.stopPropagation();

    const before = this.quantity();
    this.cartService.addItem(this.product, 1, null);

    if (before === 0) {
      this.sweetAlert.showToast(
        'top-end',
        'success',
        'Agregaste ' + `${this.product.name} a tu orden.`
      )
    }
  }

  decreaseQuantity(ev?: Event) {
    ev?.stopPropagation();

    const items = this.cartService.items();

    // Preferimos bajar el "normal" (sin instrucciones) si existe
    const idx =
      items.findIndex(i => i.productName === this.product.name && i.specialInstructions === null) ??
      -1;

    const index = idx >= 0 ? idx : items.findIndex(i => i.productName === this.product.name);
    if (index < 0) return;

    const current = items[index].quantity;
    this.cartService.updateQuantity(index, current - 1);
  }
}