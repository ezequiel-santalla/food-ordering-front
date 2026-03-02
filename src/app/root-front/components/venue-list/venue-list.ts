import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Store,
  MapPin,
  Mail,
  ExternalLink,
  Search,
  Plus,
} from 'lucide-angular';
import { RootApiService } from '../../services/root-api.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { AuthService } from '../../../auth/services/auth-service';
import { AuthResponse } from '../../../auth/models/auth';
import { TokenManager } from '../../../utils/token-manager';
import { FoodVenueAdminResponse } from '../../../admin-front/models/response/food-venue-reponse';
import { FoodVenueCardComponent } from '../../../food-venues/components/food-venue-card/food-venue-card.component';

@Component({
  selector: 'app-venue-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './venue-list.html',
})
export class VenueListComponent implements OnInit {
  private rootApi = inject(RootApiService);
  private authService = inject(AuthService);
  private swalService = inject(SweetAlertService);
  private navigation = inject(NavigationService);
  private alertservice = inject(SweetAlertService);

  protected readonly Store = Store;
  protected readonly MapPin = MapPin;
  protected readonly Mail = Mail;
  protected readonly ExternalLink = ExternalLink;
  protected readonly Search = Search;
  protected readonly Plus = Plus;

  public venues = signal<FoodVenueAdminResponse[]>([]);
  public isLoading = signal(false);

  ngOnInit(): void {
    this.fetchVenues();
  }

  fetchVenues(): void {
    this.isLoading.set(true);
    this.rootApi.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response.content || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar locales:', err);
        this.isLoading.set(false);
      },
    });
  }

  manageVenue(venue: FoodVenueAdminResponse) {
    console.log('Objeto venue recibido:', venue);

    const venueId = venue.publicId;

    if (!venueId || venueId === 'undefined') {
      console.error('❌ El venueId es inválido:', venueId);
      this.swalService.showError(
        'Error',
        'No se pudo encontrar el ID del local.',
      );
      return;
    }

    this.swalService.showLoading(`Cambiando contexto a ${venue.name}...`);

    this.rootApi.selectContext(venueId).subscribe({
      next: (response) => {
        this.authService.applyAuthData(response);
        this.swalService.showSuccess(
          'Modo Gestión Root',
          `Ahora visualizas: ${venue.name}`,
        );
        this.navigation.navigateToAdminDashboard();
      },
      error: (err) => {
        console.error('❌ Error en selectContext:', err);
        this.swalService.showError(
          'Error',
          'No se pudo establecer el contexto.',
        );
      },
    });
  }

  onDelete(venue: FoodVenueAdminResponse) {
    this.alertservice
      .confirm(
        '¿Eliminar Restaurante?',
        `Vas a eliminar el local ${venue.name}. Esta acción es reversible desde el panel de eliminados.`,
        'Eliminar',
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.deleteFoodVenue(venue.publicId);
        }
      });
  }

  private deleteFoodVenue(id: string): void {
    this.rootApi.deleteFoodVenue(id).subscribe({
      next: () => {
        this.alertservice.showSuccess(
          'Eliminado',
          'El restaurante ha sido borrado.',
        );
        this.fetchVenues();
      },
      error: () =>
        this.alertservice.showError(
          'Error',
          'No se pudo eliminar el restaurante.',
        ),
    });
  }
}
