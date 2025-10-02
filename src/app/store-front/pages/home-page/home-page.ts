import { Component } from '@angular/core';
import { Recommendations } from '../../components/recommendations/recommendations';
import { Menu } from '../../components/menu/menu';

@Component({
  selector: 'app-home-page',
  imports: [Recommendations, Menu],
  templateUrl: './home-page.html'
})
export class HomePage {

}
