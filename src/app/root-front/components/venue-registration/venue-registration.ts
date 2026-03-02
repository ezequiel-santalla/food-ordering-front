import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RootApiService } from '../../services/root-api.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select-component/searchable-select-component';
import { LocationService, CountryResponseDto, ProvinceResponseDto, CityResponseDto } from '../../../auth/services/location-service';
import { LucideAngularModule, Camera, CloudUpload, ArrowLeft } from 'lucide-angular';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-root-venue-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, SearchableSelectComponent],
  templateUrl: './venue-registration.html'
})
export class RootVenueRegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rootApi = inject(RootApiService);
  private swal = inject(SweetAlertService);
  private locationService = inject(LocationService);

  protected readonly UploadCloud = CloudUpload;
  protected readonly Camera = Camera;
  protected readonly ArrowLeft = ArrowLeft;

  
  navigation = inject(NavigationService);

  countries = signal<CountryResponseDto[]>([]);
  provinces = signal<ProvinceResponseDto[]>([]);
  cities = signal<CityResponseDto[]>([]);

  logoFile = signal<File | null>(null);
  bannerFile = signal<File | null>(null);

  venueForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+54\s?9?\s?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}$/)]],
    address: this.fb.group({
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      countryId: [null as number | null, Validators.required],
      provinceId: [null as number | null, Validators.required],
      cityId: [null as number | null, Validators.required],
      additionalInfo: ['']
    })
  });

  ngOnInit() {
    this.locationService.getCountries().subscribe(data => this.countries.set(data));

    this.venueForm.get('address.countryId')!.valueChanges.subscribe(countryId => {
      this.resetLocationFields(['provinceId', 'cityId']);
      if (countryId) {
        this.locationService.getProvincesByCountry(Number(countryId))
          .subscribe(data => this.provinces.set(data));
      }
    });

    this.venueForm.get('address.provinceId')!.valueChanges.subscribe(provinceId => {
      this.resetLocationFields(['cityId']);
      if (provinceId) {
        this.locationService.getCitiesByProvince(Number(provinceId))
          .subscribe(data => this.cities.set(data));
      }
    });
  }

  private resetLocationFields(fields: string[]) {
    fields.forEach(field => {
      this.venueForm.get(`address.${field}`)?.reset(null, { emitEvent: false });
    });
    if (fields.includes('provinceId')) this.provinces.set([]);
    if (fields.includes('cityId')) this.cities.set([]);
  }

  onFileChange(event: any, type: 'logo' | 'banner') {
    const file = event.target.files[0];
    if (file) {
      type === 'logo' ? this.logoFile.set(file) : this.bannerFile.set(file);
    }
  }

  onSubmit() {
    if (this.venueForm.invalid) return;
    this.swal.showLoading('Creando Food Venue...');
    
    const rawValue = this.venueForm.getRawValue();
    const payload = {
      ...rawValue,
      address: {
        ...rawValue.address,
        cityId: Number(rawValue.address.cityId)
      }
    };

    this.rootApi.createFoodVenue(payload, this.logoFile() || undefined, this.bannerFile() || undefined).subscribe({
      next: () => {
        this.swal.showSuccess('¡Sede Creada!', 'El local ha sido registrado exitosamente.');
        this.navigation.navigateToRootDashboard();
      },
      error: () => this.swal.showError('Error', 'Hubo un problema al crear el local.')
    });
  }
}