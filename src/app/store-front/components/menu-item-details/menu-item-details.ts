import { Component, inject } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-menu-item-details',
  imports: [MenuItemCard],
  templateUrl: './menu-item-details.html'
})
export class MenuItemDetails {

  private route = inject(ActivatedRoute);
  private menuService = inject(MenuService);

  private routeParams = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => of(params.get('name')))
    )
  );

  menuItemResource = rxResource({
    params: () => ({
      name: this.routeParams()
    }),
    stream: ({ params }) => {
      if (!params.name) {
        console.log('❌ No hay nombre de producto en la ruta');
        return of(null);
      }

      console.log('🔍 Buscando producto:', params.name);
      return this.menuService.getMenuItemByName(params.name);
    }
  });

  isRootRoute = () => {
    return this.route.snapshot.children.length === 0;
  };
}
