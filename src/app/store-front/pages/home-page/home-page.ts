import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuService } from '../../services/menu-service';
import { HighlightsSection } from '../../components/highlights/highlights-section/highlights-section';
import { FavoritesService } from '../../services/favorite-service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, HighlightsSection],
  templateUrl: './home-page.html',
})
export class HomePage {
  menuService = inject(MenuService);
  favoritesService = inject(FavoritesService);
  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });
}
