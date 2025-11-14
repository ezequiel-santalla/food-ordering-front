import { Component, input } from '@angular/core';
import { Content } from '../../models/food-venue.interface';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPinHouse, MapPlus } from 'lucide-angular';

@Component({
  selector: 'app-food-venue-card',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './food-venue-card.component.html',
})
export class FoodVenueCardComponent {

  readonly MapPinHouse = MapPinHouse
  readonly MapPlus = MapPlus

  venue = input.required<Content>();
}
