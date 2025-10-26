import { Component, inject, input, output } from '@angular/core';
import { Product } from '../../models/menu.interface';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-menu-item-detail-modal',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './menu-item-detail-modal.html',
  styleUrl: './menu-item-detail-modal.css'
})
export class MenuItemDetailModal {

  product = input.required<Product>();
  close = output<void>();

  private cartService = inject(CartService);

  quantity = 1;
  specialInstructions = '';

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    const prod = this.product();

    const instructions = prod.customizable ? this.specialInstructions : null;
    
      this.cartService.addItem(
        prod.name,
        prod.price,
        instructions,
        this.quantity,
        prod.imageUrl
      );

    this.close.emit();
  }
}
