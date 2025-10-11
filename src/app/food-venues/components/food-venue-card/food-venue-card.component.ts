import { Component, input } from '@angular/core';
import { Content } from '../../models/food-venue.interface';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-food-venue-card',
  imports: [RouterLink],
  templateUrl: './food-venue-card.component.html',
})
export class FoodVenueCardComponent {

  venue = input.required<Content>();
}
