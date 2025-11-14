import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FoodVenueService } from '../../services/food-venue.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { NotFoundPage } from "../../../store-front/pages/not-found-page/not-found-page";
import { RouterOutlet } from '@angular/router';
import { FoodVenueMenuComponent } from "../../components/food-venue-menu/food-venue-menu.component";

@Component({
  selector: 'app-food-venue-menu-page',
  imports: [NotFoundPage, RouterOutlet, FoodVenueMenuComponent],
  templateUrl: './food-venue-menu-page.component.html',
})
export class FoodVenueMenuPageComponent {

  private route = inject(ActivatedRoute);
  private foodVenueService = inject(FoodVenueService);

  foodVenueResource = rxResource({
    params: () => {
      const id = this.route.snapshot.paramMap.get('id');
      return { id };
    },
    stream: ({ params }) => {
      if (!params.id) return of(null);

      return this.foodVenueService.getMenuByFoodVenueId(params.id);
    }
  });

  isRootRoute = () => {
    return this.route.snapshot.children.length === 0;
  };
}
