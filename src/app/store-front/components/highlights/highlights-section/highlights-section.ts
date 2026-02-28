import { Component, computed, output, signal, input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { MenuHighlightCard } from '../menu-highlight-card/menu-highlight-card';
import { MenuItemDetailModal } from '../../menu/menu-item-detail-modal/menu-item-detail-modal';
import { Product } from '../../../models/menu.interface';
import { LucideAngularModule, Star, Flame, Heart } from 'lucide-angular';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-highlights-section',
  standalone: true,
  imports: [CommonModule, MenuHighlightCard, MenuItemDetailModal, LucideAngularModule],
  templateUrl: './highlights-section.html',
})
export class HighlightsSection {

  constructor(private router: Router) {}

  readonly Star = Star;
  readonly Flame = Flame;
  readonly Heart = Heart;

  title = input.required<string>();
  emptyText = input<string>('No hay productos para mostrar.');
  emptyMessage = input<string | null>(null);
  data$ = input.required<Observable<Product[]>>();

  variant = input<'premium' | 'pop' | 'minimal'>('premium');

  add = output<Product>();
  select = output<Product>();

  @ViewChild('hScroll') hScroll?: ElementRef<HTMLDivElement>;

  ngOnInit() {
  this.router.events.pipe(
    filter(e => e instanceof NavigationEnd)
  ).subscribe(() => {
    setTimeout(() => {
      const el = document.getElementById('hscroll-' + this.title());
      el?.scrollTo({ left: 0 });
    }, 200);
  });
}

  selected = signal<Product | undefined>(undefined);
  openProduct = (p: Product) => this.selected.set(p);

  resource = rxResource({
    stream: () => this.data$().pipe(catchError(() => of([] as Product[]))),
  });

  items = computed(() => this.resource.value() ?? []);
}
