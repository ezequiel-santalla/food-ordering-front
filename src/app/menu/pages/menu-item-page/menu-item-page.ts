import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../../services/menu-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MenuItemCard } from '../../../store-front/components/menu-item-card/menu-item-card';
import { AddItemToCartSpec } from '../../../store-front/components/add-item-to-cart-spec/add-item-to-cart-spec';

@Component({
  selector: 'app-menu-item-page',
  imports: [MenuItemCard, AddItemToCartSpec],
  templateUrl: './menu-item-page.html'
})
export class MenuItemPage {

  private route = inject(ActivatedRoute);
  private menuService = inject(MenuService);

  private menuItemId = toSignal(
    this.route.paramMap.pipe(
      map(params => Number(params.get('id')))
    )
  );

  menuItem = computed(() => {
    const id = this.menuItemId();

    return id ? this.menuService.getMenuItem(id) : null;
  });
}
