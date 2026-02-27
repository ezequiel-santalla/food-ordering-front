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
import { Heart, Plus, Minus, LucideAngularModule, ShoppingCart } from 'lucide-angular';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { FavoritesService } from '../../../services/favorite-service';
import { AuthStateManager } from '../../../../auth/services/auth-state-manager-service';
import { NavigationService } from '../../../../shared/services/navigation.service';

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
  private navigation = inject(NavigationService);

  quantity = 1;
  specialInstructions = '';

  readonly Heart = Heart;
  readonly ShoppingCart = ShoppingCart;
  readonly Plus = Plus;
  readonly Minus = Minus;

  isFavorite = signal(false);
  isFavLoading = signal(false);

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

  async toggleFavorite(event: Event) {
    event.stopPropagation();

    if (this.isFavLoading()) return;

    if (!this.authState.isAuthenticated()) {
      const deseaLoguearse = await this.sweetAlert.promptLoginForFavorites();

      if (deseaLoguearse) {
        this.close.emit();
        this.navigation.navigateToLogin();
      }
      return;
    }

    const p = this.product();

    this.isFavLoading.set(true);
    this.sweetAlert.showToast('top-end', 'info', 'Actualizando favorito...');

    this.favoritesService.toggle(p.publicId).subscribe({
      next: (res) => {
        this.isFavorite.set(res.isFavorite);
        this.isFavLoading.set(false);
      },
      error: async () => {
        const deseaLoguearse = await this.sweetAlert.promptLoginForFavorites();
        if (deseaLoguearse) {
          this.close.emit();
          this.navigation.navigateToLogin();
        } else {
          this.sweetAlert.showToast('top-end', 'error', 'No se pudo actualizar el favorito.');
        }
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

    this.sweetAlert.showToast(
      'top-end',
      'success',
      'Agregaste ' + `${this.product.name} a tu orden.`
    )
  }
}
