import { Component, inject, signal } from '@angular/core';
import { Menu } from '../../../store-front/components/menu/menu';
import { MenuService } from '../../services/menu-service';

@Component({
  selector: 'app-menu-page',
  imports: [Menu],
  templateUrl: './menu-page.html'
})
export class MenuPage {

  menu = inject(MenuService);
}
