import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FoodVenueService } from '../../services/food-venue-service';
import { FoodVenueAdminResponse } from '../../models/response/food-venue-reponse';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CityResponseDto, CountryResponseDto, LocationService, ProvinceResponseDto } from '../../../auth/services/location-service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select-component/searchable-select-component';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-my-food-venue-page',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SearchableSelectComponent],
  templateUrl: './my-food-venue-page.html'
})
export class MyFoodVenuePage implements OnInit {

  private fb = inject(FormBuilder);
  private foodVenueService = inject(FoodVenueService);
  private locationService = inject(LocationService);
  private sweetAlert = inject(SweetAlertService);

  readonly colorFields = [
    { label: 'Color Primario', controlName: 'primaryColor' },
    { label: 'Color Secundario', controlName: 'secondaryColor' },
    { label: 'Color de Acento', controlName: 'accentColor' },
    { label: 'Color de Fondo', controlName: 'backgroundColor' },
    { label: 'Color de Texto', controlName: 'textColor' },
  ];

  venueForm!: FormGroup;
  loading = false;
  isEditing = false;

  selectedLogo: File | null = null;
  selectedBanner: File | null = null;
  logoPreview: string | null = null;
  bannerPreview: string | null = null;

  countries = signal<CountryResponseDto[]>([]);
  provinces = signal<ProvinceResponseDto[]>([]);
  cities = signal<CityResponseDto[]>([]);

  venueResource = rxResource({
    stream: () => this.foodVenueService.getMyFoodVenue()
  });

  constructor() {
    this.initForm();

    effect(() => {
      const venue = this.venueResource.value();
      if (venue) {
        this.populateForm(venue);
        this.venueForm.disable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.locationService.getCountries().subscribe(data => this.countries.set(data));

    this.venueForm.get('address.countryId')!.valueChanges.subscribe(countryId => {
      this.venueForm.get('address.provinceId')!.reset(null, { emitEvent: false });
      this.venueForm.get('address.cityId')!.reset(null, { emitEvent: false });
      this.provinces.set([]);
      this.cities.set([]);
      this.venueForm.get('address.provinceId')!.disable({ emitEvent: false });
      this.venueForm.get('address.cityId')!.disable({ emitEvent: false });

      if (countryId) {
        this.locationService.getProvincesByCountry(Number(countryId))
          .subscribe(data => {
            this.provinces.set(data);
            if (this.isEditing) this.venueForm.get('address.provinceId')!.enable({ emitEvent: false });
          });
      }
    });

    this.venueForm.get('address.provinceId')!.valueChanges.subscribe(provinceId => {
      this.venueForm.get('address.cityId')!.reset(null, { emitEvent: false });
      this.cities.set([]);
      this.venueForm.get('address.cityId')!.disable({ emitEvent: false });

      if (provinceId) {
        this.locationService.getCitiesByProvince(Number(provinceId))
          .subscribe(data => {
            this.cities.set(data);
            if (this.isEditing) this.venueForm.get('address.cityId')!.enable({ emitEvent: false });
          });
      }
    });
  }

  private initForm(): void {
    this.venueForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: this.fb.group({
        street: ['', Validators.required],
        number: ['', Validators.required],
        postalCode: ['', Validators.required],
        countryId: [null],
        provinceId: [null],
        cityId: [null, Validators.required],
      }),
      style: this.fb.group({
        slogan: ['', [Validators.maxLength(200)]],
        description: ['', [Validators.maxLength(1000)]],
        publicMenu: [false],
        primaryColor: [{ value: '#3b82f6', disabled: true }],
        secondaryColor: [{ value: '#8b5cf6', disabled: true }],
        accentColor: [{ value: '#f59e0b', disabled: true }],
        backgroundColor: [{ value: '#ffffff', disabled: true }],
        textColor: [{ value: '#000000', disabled: true }],
        logoUrl: [''],
        bannerUrl: [''],
        instagramUrl: [''],
        facebookUrl: [''],
        whatsappNumber: ['']
      })
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      this.venueForm.enable({ emitEvent: false });
      // Colores siempre deshabilitados
      this.venueForm.get('style.primaryColor')?.disable({ emitEvent: false });
      this.venueForm.get('style.secondaryColor')?.disable({ emitEvent: false });
      this.venueForm.get('style.accentColor')?.disable({ emitEvent: false });
      this.venueForm.get('style.backgroundColor')?.disable({ emitEvent: false });
      this.venueForm.get('style.textColor')?.disable({ emitEvent: false });

      if (!this.venueForm.get('address.countryId')?.value) {
        this.venueForm.get('address.provinceId')?.disable({ emitEvent: false });
        this.venueForm.get('address.cityId')?.disable({ emitEvent: false });
      }
    } else {
      this.selectedLogo = null;
      this.selectedBanner = null;
      const venue = this.venueResource.value();
      if (venue) this.populateForm(venue);
      this.venueForm.disable({ emitEvent: false });
    }
  }

  private populateForm(data: any): void {
    const address = data.address;

    this.venueForm.patchValue({
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: {
        street: address?.street || '',
        number: address?.number || '',
        postalCode: address?.postalCode || '',
      }
    }, { emitEvent: false });

    const style = data.venueStyle;
    if (style) {
      this.venueForm.get('style')?.patchValue({
        slogan: style.slogan || '',
        description: style.description || '',
        publicMenu: style.publicMenu ?? false,
        primaryColor: style.primaryColor || '#3b82f6',
        secondaryColor: style.secondaryColor || '#8b5cf6',
        accentColor: style.accentColor || '#f59e0b',
        backgroundColor: style.backgroundColor || '#ffffff',
        textColor: style.textColor || '#000000',
        logoUrl: style.logoUrl || '',
        bannerUrl: style.bannerUrl || '',
        instagramUrl: style.instagramUrl || '',
        facebookUrl: style.facebookUrl || '',
        whatsappNumber: style.whatsappNumber || '',
      }, { emitEvent: false });

      this.logoPreview = style.logoUrl || null;
      this.bannerPreview = style.bannerUrl || null;
    }

    if (!address?.country) return;

    this.locationService.getCountries().subscribe(countries => {
      this.countries.set(countries);

      const country = countries.find(c => c.name.toLowerCase() === address.country.toLowerCase());
      if (!country) return;

      this.venueForm.get('address.countryId')!.setValue(country.id, { emitEvent: false });

      this.locationService.getProvincesByCountry(country.id).subscribe(provinces => {
        this.provinces.set(provinces);

        const province = provinces.find(p => p.name.toLowerCase() === address.province?.toLowerCase());
        if (!province) return;

        this.venueForm.get('address.provinceId')!.setValue(province.id, { emitEvent: false });

        this.locationService.getCitiesByProvince(province.id).subscribe(cities => {
          this.cities.set(cities);

          const city = cities.find(c => c.name.toLowerCase() === address.city?.toLowerCase());
          if (!city) return;

          this.venueForm.get('address.cityId')!.setValue(city.id, { emitEvent: false });
        });
      });
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.selectedLogo = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => this.logoPreview = e.target.result;
      reader.readAsDataURL(this.selectedLogo);
    }
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.selectedBanner = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => this.bannerPreview = e.target.result;
      reader.readAsDataURL(this.selectedBanner);
    }
  }

  removeLogo(): void {
    this.selectedLogo = null;
    this.logoPreview = null;
    this.venueForm.get('style.logoUrl')?.setValue('');
  }

  removeBanner(): void {
    this.selectedBanner = null;
    this.bannerPreview = null;
    this.venueForm.get('style.bannerUrl')?.setValue('');
  }

  saveChanges(): void {
    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.createFormData();

    this.foodVenueService.updateMyCurrentFoodVenue(formData).subscribe({
      next: () => {
        this.loading = false;
        this.isEditing = false;
        this.selectedLogo = null;
        this.selectedBanner = null;
        this.venueForm.disable({ emitEvent: false });
        this.venueResource.reload();
        this.sweetAlert.showSuccess('¡Listo!', 'Local actualizado correctamente.', 2000);
      },
      error: (err) => {
        console.error('Error al actualizar local', err);
        this.loading = false;
        const message = err?.error?.message || 'Error al actualizar el local.';
        this.sweetAlert.showError('Ocurrió un problema', message);
      }
    });
  }

  private createFormData(): FormData {
    const formData = new FormData();
    const formValues = this.venueForm.getRawValue();

    const venueData = {
      name: formValues.name,
      email: formValues.email,
      phone: formValues.phone,
      address: {
        street: formValues.address.street,
        number: formValues.address.number,
        postalCode: formValues.address.postalCode,
        cityId: Number(formValues.address.cityId),
      },
      styleRequestDto: {
        slogan: formValues.style.slogan || '',
        description: formValues.style.description || '',
        publicMenu: formValues.style.publicMenu,
        instagramUrl: formValues.style.instagramUrl || '',
        facebookUrl: formValues.style.facebookUrl || '',
        whatsappNumber: formValues.style.whatsappNumber || '',
        logoUrl: formValues.style.logoUrl || '',
        bannerUrl: formValues.style.bannerUrl || ''
      }
    };

    formData.append('venue', new Blob([JSON.stringify(venueData)], { type: 'application/json' }));

    if (this.selectedLogo) formData.append('logo', this.selectedLogo);
    if (this.selectedBanner) formData.append('banner', this.selectedBanner);

    return formData;
  }
}
