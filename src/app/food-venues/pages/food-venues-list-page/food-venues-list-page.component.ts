import { Component, inject, signal } from '@angular/core';
import { FoodVenueListComponent } from "../../components/food-venue-list/food-venue-list.component";
import { FoodVenueService } from '../../services/food-venue.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-food-venues-list-page',
  imports: [FoodVenueListComponent],
  templateUrl: './food-venues-list-page.component.html',
})
export class FoodVenuesListPageComponent {

  foodVenueService = inject(FoodVenueService);

  foodVenueResource = rxResource({
    stream: ({ }) => {
      return this.foodVenueService.getFoodVenues().pipe(
        map(response => response.content)
      );
    }
  });
}
