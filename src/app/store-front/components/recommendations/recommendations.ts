import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuService } from '../../services/menu.service';
import { Product } from '../../models/menu.interface';
import { MenuItemDetailModal } from '../menu-item-detail-modal/menu-item-detail-modal';
import { MenuRecommendationCard } from '../menu-recommendation-card/menu-recommendation-card';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, MenuRecommendationCard, MenuItemDetailModal],
  templateUrl: './recommendations.html'
})
export class Recommendations {
  private menuService = inject(MenuService);
  private cartService = inject(CartService);

  selectedProduct = signal<Product | undefined>(undefined);

  openProduct(product: Product) {
    this.selectedProduct.set(product);
  }
  closeModal() {
    this.selectedProduct.set(undefined);
  }

  addToCart(product: Product) {
    // ajustá a tu API real del carrito si difiere
    this.cartService.addItem(product.name, product.price, null, 1, product.imageUrl);
  }

  recommendationsResource = rxResource({
    stream: () => this.menuService.getRecommendations(),
  });

  recommendations = computed(() => this.recommendationsResource.value() ?? []);
}
