import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

@Component({
  selector: 'app-menu-item-page',
  imports: [],
  templateUrl: './menu-item-page.html',
})
export class MenuItemPage {

  private route = inject(ActivatedRoute);
  private menuService = inject(MenuService);

  menuResource = rxResource({
    params: () => {
      const name = this.route.snapshot.paramMap.get('name');

      return { name };
    },
    stream: ({ params }) => {
      if (!params.name) return of(null);

      return this.menuService.getMenuItemByPublicId(params.name);
    }
  });

  isRootRoute = () => {
    return this.route.snapshot.children.length === 0;
  };
}
