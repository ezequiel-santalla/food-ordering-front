import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FoodVenueService } from '../../services/food-venue.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { NotFoundPage } from "../../../store-front/pages/not-found-page/not-found-page";
import { RouterOutlet } from '@angular/router';
import { FoodVenueMenuComponent } from "../../components/food-venue-menu/food-venue-menu.component";
import { DinnoHttpError } from '../../../shared/errors/dinno-http-error';

@Component({
  selector: 'app-food-venue-menu-page',
  imports: [NotFoundPage, RouterOutlet, FoodVenueMenuComponent],
  templateUrl: './food-venue-menu-page.component.html',
})
export class FoodVenueMenuPageComponent {

  private route = inject(ActivatedRoute);
  private foodVenueService = inject(FoodVenueService);

  venueId = computed(() => this.route.snapshot.paramMap.get('id'));

  menuResource = rxResource({
    params: () => ({ id: this.venueId() }),
    stream: ({ params }) => {
      if (!params.id) return of(null);
      return this.foodVenueService.getMenuByFoodVenueId(params.id);
    },
  });

  menu = computed(() => this.menuResource.value());
  isLoading = computed(() => this.menuResource.isLoading());

  errorMessage = computed(() => {
    const err = this.menuResource.error() as DinnoHttpError | any | null;
    return err?.message ?? err?.error?.message ?? null;
  });

  retry(): void {
    const id = this.venueId();
    if (id) this.foodVenueService.clearMenuCacheForVenue(id);
    this.menuResource.reload();
  }

  isRootRoute = () => {
    return this.route.snapshot.children.length === 0;
  };

  isNotFound = computed(() => {
    const err = this.menuResource.error() as any | null;
    const status = err?.status ?? err?.error?.status ?? null;
    return status === 404;
  });
}
