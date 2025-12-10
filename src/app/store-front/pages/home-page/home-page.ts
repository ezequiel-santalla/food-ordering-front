import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuService } from '../../services/menu-service';
import { HighlightsSection } from '../../components/highlights-section/highlights-section';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, HighlightsSection],
  templateUrl: './home-page.html'
})
export class HomePage {
  menuService = inject(MenuService);
  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });
}
