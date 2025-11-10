import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Product } from '../../models/menu.interface';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { LucideAngularModule, Star } from 'lucide-angular';

@Component({
  selector: 'app-menu-item-detail-modal',
  imports: [FormsModule, CurrencyPipe, LucideAngularModule],
  templateUrl: './menu-item-detail-modal.html',
  styleUrl: './menu-item-detail-modal.css',
})
export class MenuItemDetailModal {
  product = input.required<Product>();
  close = output<void>();

  private cartService = inject(CartService);

  quantity = 1;
  specialInstructions = '';

  readonly Star = Star;
  isFavorite = signal(false);

  constructor() {
    // 9. Este 'effect' se ejecutará cuando el producto cambie.
    effect(() => {
      const currentProduct = this.product();
      if (currentProduct) {
        // --- TODO Implementar logica para productos favoritos ---
        console.log('TODO: Comprobar si', currentProduct.name, 'es favorito');
        // const isFav = this.favoriteService.isFavorite(currentProduct.id);
        // this.isFavorite.set(isFav);
        
        this.isFavorite.set(false);
      }
    });
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    this.isFavorite.set(!this.isFavorite());
    
    console.log('TODO: Llamar al backend para guardar favorito:', this.product().name, this.isFavorite());
    // --- Lógica futura ---
    // if (this.isFavorite()) {
    //   this.favoriteService.addFavorite(this.product().id).subscribe();
    // } else {
    //   this.favoriteService.removeFavorite(this.product().id).subscribe();
    // }
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    const prod = this.product();
    const instructions = prod.customizable ? this.specialInstructions : null;

    // Llama al nuevo método del servicio
    this.cartService.addItem(
      prod, 
      this.quantity, 
      instructions
    );

    this.close.emit();
  }
}
