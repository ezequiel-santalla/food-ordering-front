import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MenuService } from '../../services/menu-service';
import { FavoritesService } from '../../services/favorite-service';
import { AuthStateManager } from '../../../auth/services/auth-state-manager-service'; // ajustá el path
import { HighlightsSection } from '../../components/highlights/highlights-section/highlights-section';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, HighlightsSection],
  templateUrl: './home-page.html',
})
export class HomePage {
  menuService = inject(MenuService);
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
}
