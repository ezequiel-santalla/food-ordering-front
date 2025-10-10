import { Component, computed, inject } from '@angular/core';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { MenuService } from '../../services/menu.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-recommendations',
  imports: [MenuItemCard],
  templateUrl: './recommendations.html'
})
export class Recommendations {

  menuService = inject(MenuService);

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
