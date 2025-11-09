import { Component, Input, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MenuHighlightCard } from '../menu-highlight-card/menu-highlight-card';
import { MenuItemDetailModal } from '../menu-item-detail-modal/menu-item-detail-modal';
import { Product } from '../../models/menu.interface';

@Component({
  selector: 'app-highlights-section',
  standalone: true,
  imports: [CommonModule, MenuHighlightCard, MenuItemDetailModal],
  template: `
<section>
  <h2 class="text-xl font-bold text-base-content my-4 px-4 sm:px-6">{{ title }}</h2>

  @if (res.isLoading()) {
    <div class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }

  @if (res.error()) {
    <div class="text-center py-4 text-error">Error al cargar {{ title.toLowerCase() }}</div>
  }

  @if (items().length) {
    <div class="overflow-x-auto scrollbar-hide mb-6">
      <div class="flex gap-4 items-stretch">
        @for (p of items(); track p.publicId) {
          <app-menu-highlight-card
            [product]="p"
            (select)="openProduct(p)"
            (add)="add.emit(p)" />
        }
      </div>
    </div>
  } @else if (!res.isLoading() && !res.error()) {
    <p class="text-center text-base-content/70 italic py-6">{{ emptyText }}</p>
  }

  @if (selected()) {
    <app-menu-item-detail-modal
      [product]="selected()!"
      (close)="selected.set(undefined)" />
  }
</section>
  `
})
export class HighlightsSection {
  @Input({ required: true }) title!: string;
  @Input() emptyText = 'No hay productos para mostrar.';
  @Input({ required: true }) data$!: Observable<Product[]>;

  add = output<Product>();
  select = output<Product>();

  selected = signal<Product | undefined>(undefined);
  openProduct = (p: Product) => this.selected.set(p);

  res = rxResource({
    stream: () => this.data$.pipe(
      catchError(() => of([] as Product[]))
    )
  });

  items = computed(() => this.res.value() ?? []);
}
