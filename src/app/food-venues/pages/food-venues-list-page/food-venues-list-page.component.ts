import { Component, computed, effect, inject } from '@angular/core';
import { FoodVenueListComponent } from '../../components/food-venue-list/food-venue-list.component';
import { FoodVenueService } from '../../services/food-venue.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DinnoHttpError } from '../../../shared/errors/dinno-http-error';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-food-venues-list-page',
  imports: [FoodVenueListComponent],
  templateUrl: './food-venues-list-page.component.html',
})
export class FoodVenuesListPageComponent {
  private foodVenueService = inject(FoodVenueService);
  private sweetAlert = inject(SweetAlertService);

  constructor() {
  effect(() => {
    if (!this.isBusy()) {
      this.sweetAlert.closeAll?.();
    }
  });
}

  foodVenueResource = rxResource({
    stream: () =>
      this.foodVenueService.getFoodVenues().pipe(
        map((response) => response.content)
      ),
  });

  isBusy = computed(() => {
    const s = this.foodVenueResource.status();
    return s === 'loading' || s === 'reloading';
  });

  loadingText = computed(() => {
    const s = this.foodVenueResource.status();
    return s === 'reloading' ? 'Reintentando conexión...' : 'Cargando restaurantes...';
  });

  error = computed(() => this.foodVenueResource.error() as DinnoHttpError | null);

  foodVenues = computed(() => this.foodVenueResource.value() ?? []);

  errorMessage = computed(() => {
    const err = this.error();
    if (!err) return null;
    return err.message ?? 'No se pudieron cargar los locales.';
  });

  retry(): void {
    this.sweetAlert.showLoading('Reintentando...', 'Conectando con el servidor');
    this.foodVenueResource.reload();
  }
}