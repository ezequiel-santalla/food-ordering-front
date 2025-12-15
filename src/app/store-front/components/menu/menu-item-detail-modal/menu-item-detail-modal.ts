import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Product } from '../../../models/menu.interface';
import { CartService } from '../../../services/cart-service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Heart, LucideAngularModule } from 'lucide-angular';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { FavoritesService } from '../../../services/favorite-service';
import { AuthStateManager } from '../../../../auth/services/auth-state-manager-service'; 

@Component({
  selector: 'app-menu-item-detail-modal',
  imports: [FormsModule, CurrencyPipe, LucideAngularModule, NgClass],
  templateUrl: './menu-item-detail-modal.html',
  styleUrl: './menu-item-detail-modal.css',
})
export class MenuItemDetailModal {
  product = input.required<Product>();
  close = output<void>();

  private cartService = inject(CartService);
  private sweetAlert = inject(SweetAlertService);
  private favoritesService = inject(FavoritesService);
  private authState = inject(AuthStateManager);

  quantity = 1;
  specialInstructions = '';

  readonly Heart = Heart;
  isFavorite = signal(false);

  constructor() {
  effect(() => {
    const p = this.product();
    if (!p) return;

    if (!this.authState.isAuthenticated()) {
      this.isFavorite.set(false);
      return;
    }

    this.favoritesService.loadFavoriteIds().subscribe((set) => {
      this.isFavorite.set(set.has(p.publicId));
    });
  });
}


  toggleFavorite(event: Event) {
    event.stopPropagation();

    // ✅ Invitado / no logueado: enganche
    if (!this.authState.isAuthenticated()) {
      this.sweetAlert.promptLoginForFavorites();
      return;
    }

    // ✅ Llamar back y usar el estado final real
    const p = this.product();

    this.favoritesService.toggle(p.publicId).subscribe({
      next: (res) => {
        this.isFavorite.set(res.isFavorite);

        // opcional: feedback mini
        // this.sweetAlert.showSuccess(
        //   res.isFavorite ? 'Agregado a favoritos' : 'Quitado de favoritos',
        //   p.name,
        //   1200
        // );
      },
      error: () => {
        this.sweetAlert.promptLoginForFavorites();
      },
    });
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    const prod: Product = this.product();
    const instructions = prod.customizable ? this.specialInstructions : null;

    this.cartService.addItem(prod, this.quantity, instructions);
    this.close.emit();

    this.sweetAlert.showSuccess(
      '¡Agregado!',
      `${this.product().name} fue añadido a tu orden.`,
      1500
    );
  }
}
