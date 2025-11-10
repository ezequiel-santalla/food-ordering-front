// app-menu-item-card.ts
import { Component, inject, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, Star } from 'lucide-angular';
import { Product } from '../../models/menu.interface';
import { CartService } from '../../services/cart.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

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
  readonly Star = Star;

  select = output<Product>();

  onActionClick(event: Event) {
    event.stopPropagation();
this.cartService.addItem(
      this.product, 
      1,    // Cantidad 1
      null  // Sin instrucciones
    );
    
    // 7. (Opcional) Da feedback al usuario
    this.sweetAlert.showSuccess(
      '¡Agregado!',
      `${this.product.name} fue añadido a tu orden.`,
      1500 // 1.5 segundos
    );
  }
}
