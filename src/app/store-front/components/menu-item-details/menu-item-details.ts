import { Component, computed, inject, Input } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { toSignal } from '@angular/core/rxjs-interop';
import { Product } from '../../models/menu.interface';

@Component({
  selector: 'app-menu-item-details',
  standalone: true,
  imports: [MenuItemCard],
  templateUrl: './menu-item-details.html'
})
export class MenuItemDetails {

  private route = inject(ActivatedRoute);
  private menuService = inject(MenuService);

  @Input() product?: Product;
  @Input() name?: string;

  private routeNameSig = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('name') || null)),
    { initialValue: null }
  );
  effectiveName = computed(() => this.name ?? this.routeNameSig());

menuItemResource = rxResource({
    stream: () => {
      if (this.product) return of(this.product);

      const name = this.effectiveName();
      if (!name || !name.trim()) {
        return of(null);
      }
      return this.menuService.getMenuItemByName(name);
    },
  });

  isRootRoute = () => {
    return this.route.snapshot.children.length === 0;
  };
}
