import { Component, computed, output, signal, input } from '@angular/core';
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
  templateUrl: './highlights-section.html'
})
export class HighlightsSection {

  title = input.required<string>();
  emptyText = input<string>('No hay productos para mostrar.');
  data$ = input.required<Observable<Product[]>>();

  variant = input<'premium' | 'pop' | 'minimal'>('premium');

  add = output<Product>();
  select = output<Product>();

  selected = signal<Product | undefined>(undefined);
  openProduct = (p: Product) => this.selected.set(p);

  resource = rxResource({
    stream: () =>
      this.data$().pipe(
        catchError(() => of([] as Product[]))
      )
  });

  items = computed(() => this.resource.value() ?? []);
}
