import { Component, inject, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../../models/menu.interface';
import { CartService } from '../../services/cart.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-menu-highlight-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './menu-highlight-card.html',
})
export class MenuHighlightCard {
  @Input({ required: true }) product!: Product;

  private cartService = inject(CartService);
  private sweetAlert = inject(SweetAlertService);

  select = output<Product>();
  add = output<Product>();

onActionClick(event: Event) {
    event.stopPropagation();

    this.cartService.addItem(
      this.product, 
      1, 
      null
    );
    
    this.sweetAlert.showSuccess(
      '¡Agregado!',
      `${this.product.name} fue añadido a tu orden.`,
      1500
    );
  }
}
