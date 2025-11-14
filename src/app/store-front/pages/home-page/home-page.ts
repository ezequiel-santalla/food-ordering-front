import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuService } from '../../services/menu-service';
import { HighlightsSection } from '../../components/highlights-section/highlights-section';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, HighlightsSection],
  template: `

    <div class="max-w-3xl mx-auto py-8 space-y-8">

      <app-highlights-section
        title="Recomendaciones"
        [data$]="menuService.getRecommendations()"
      />


      <app-highlights-section
        title="Destacados"
        [data$]="menuService.getHighlights()"
      />


      <app-highlights-section
        title="Favoritos"
        [data$]="menuService.getMyFavorites()"
      />

    </div>

  `,
})
export class HomePage {
  menuService = inject(MenuService);
  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });
}

