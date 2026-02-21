import { Component, computed, input } from '@angular/core';
import { FoodVenuePublicResponseDto } from '../../models/food-venue.interface';
import { FoodVenueCardComponent } from "../food-venue-card/food-venue-card.component";

@Component({
  selector: 'app-food-venue-list',
  imports: [FoodVenueCardComponent],
  templateUrl: './food-venue-list.component.html',
})
export class FoodVenueListComponent {

  foodVenues = input.required<FoodVenuePublicResponseDto[]>();
  errorMessage = input<string | null>();
  isLoading = input<boolean>(false);

  isEmpty = computed(() => this.foodVenues().length === 0);

  shouldShowList = computed(() =>
    !this.isLoading() && !this.errorMessage() && !this.isEmpty()
  );
}
