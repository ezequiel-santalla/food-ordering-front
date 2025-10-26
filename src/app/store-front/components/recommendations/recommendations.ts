import { Component, computed, inject, signal } from '@angular/core';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { MenuService } from '../../services/menu.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Product } from '../../models/menu.interface';
import { MenuItemDetailModal } from "../menu-item-detail-modal/menu-item-detail-modal";


@Component({
  selector: 'app-recommendations',
  imports: [MenuItemCard, MenuItemDetailModal],
  templateUrl: './recommendations.html'
})
export class Recommendations {

  menuService = inject(MenuService);

  selectedProduct = signal<Product | undefined>(undefined);

  openProduct(product: Product) {
  console.log('openProduct called with:', product);
  console.log('Setting selectedProduct signal');
  this.selectedProduct.set(product);
  console.log('selectedProduct value:', this.selectedProduct());
}

  closeModal() {
    this.selectedProduct.set(undefined);
  }

  recommendationsResource = rxResource({
    stream: () => {
      console.log('🎲 Cargando recomendaciones...');
      return this.menuService.getRecommendations();
    }
  });

  recommendations = computed(() => {
    return this.recommendationsResource.value() || [];
  });
}
