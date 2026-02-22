import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MenuService } from '../../services/menu-service';
import { FavoritesService } from '../../services/favorite-service';
import { AuthStateManager } from '../../../auth/services/auth-state-manager-service';
import { HighlightsSection } from '../../components/highlights/highlights-section/highlights-section';
import { FoodVenueService } from '../../../food-venues/services/food-venue.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, HighlightsSection],
  templateUrl: './home-page.html',
})
export class HomePage {
  menuService = inject(MenuService);
  foodVenueService = inject(FoodVenueService);
  favoritesService = inject(FavoritesService);
  authState = inject(AuthStateManager);

  favoritesData$ = computed(() =>
    this.authState.isAuthenticated()
      ? this.favoritesService.favoritesList$
      : of([])
  );

  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });

  currentVenueResource = rxResource({
    stream: () => this.foodVenueService.getCurrentFoodVenue(),
  });

  currentVenue = computed(() => this.currentVenueResource.value());
  bannerUrl = computed(() => this.currentVenue()?.styles?.bannerUrl ?? null);
}
