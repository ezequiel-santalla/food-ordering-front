import { Component } from '@angular/core';
import { Menu } from '../../components/menu/menu';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [Menu],
  templateUrl: './menu-page.html'
})
export class MenuPage {}
