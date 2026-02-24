import { Component, inject, effect, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProfileService } from '../../services/profile-service';
import { TableSessionService } from '../../../store-front/services/table-session-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { LucideAngularModule, Pencil, UserRoundX } from 'lucide-angular';
import { AuthService } from '../../../auth/services/auth-service';
import { lastValueFrom } from 'rxjs';
import { NavigationService } from '../../../shared/services/navigation.service';
import { CityResponseDto, CountryResponseDto, LocationService, ProvinceResponseDto } from '../../../auth/services/location-service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select-component/searchable-select-component';
import { UserProfile } from '../../models/user-profile';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, SearchableSelectComponent],
  templateUrl: './profile-form.html',
})
export class ProfileForm implements OnInit {
  private profileService = inject(ProfileService);
  private tableSessionService = inject(TableSessionService);
  private fb = inject(FormBuilder);
  private sweetAlert = inject(SweetAlertService);
  private authService = inject(AuthService);
  private navigation = inject(NavigationService);
  private locationService = inject(LocationService);

  ngOnInit() {
    this.locationService.getCountries().subscribe(data => this.countries.set(data));

    this.profileForm.get('address.countryId')!.valueChanges.subscribe(countryId => {
      this.profileForm.get('address.provinceId')!.reset(null, { emitEvent: false });
      this.profileForm.get('address.cityId')!.reset(null, { emitEvent: false });
      this.provinces.set([]);
      this.cities.set([]);

      // Silenciar estos disable
      this.profileForm.get('address.provinceId')!.disable({ emitEvent: false });
      this.profileForm.get('address.cityId')!.disable({ emitEvent: false });

      if (countryId) {
        this.locationService.getProvincesByCountry(Number(countryId))
          .subscribe(data => {
            this.provinces.set(data);
            // Silenciar este enable
            if (this.isEditing) this.profileForm.get('address.provinceId')!.enable({ emitEvent: false });
          });
      }
    });

    this.profileForm.get('address.provinceId')!.valueChanges.subscribe(provinceId => {
      this.profileForm.get('address.cityId')!.reset(null, { emitEvent: false });
      this.cities.set([]);

      // Silenciar este disable
      this.profileForm.get('address.cityId')!.disable({ emitEvent: false });

      if (provinceId) {
        this.locationService.getCitiesByProvince(Number(provinceId))
          .subscribe(data => {
            this.cities.set(data);
            // Silenciar este enable
            if (this.isEditing) this.profileForm.get('address.cityId')!.enable({ emitEvent: false });
          });
      }
    });
  }

  readonly Pencil = Pencil;
  readonly UserRoundX = UserRoundX;

  countries = signal<CountryResponseDto[]>([]);
  provinces = signal<ProvinceResponseDto[]>([]);
  cities = signal<CityResponseDto[]>([]);

  profileForm!: FormGroup;
  isEditing = false;
  isSaving = false;

  profileResource = rxResource({
    stream: () => {
      return this.profileService.getUserProfile();
    },
  });

  constructor() {
    this.initForm();

    effect(() => {
      const profile = this.profileResource.value();
      if (profile) {
        this.populateForm(profile);
        this.profileForm.disable({ emitEvent: false });
      }
    });
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ](?!.*\s{2,})[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ](?!.*\s{2,})[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/)
      ]],
      email: [{ value: '', disabled: true }],
      phone: ['', [
        Validators.pattern(/^\+?(?!0+$)\d{10,15}$/)  // ← sin espacios ni guiones
      ]],
      birthDate: ['', Validators.required],
      address: this.fb.group({
        street: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ](?!.*\s{2,})[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s./]*[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]$/)
        ]],
        number: ['', [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern(/^[a-zA-Z0-9\s]+$/)
        ]],
        postalCode: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9]+$/)  // ← sin espacios ni guiones
        ]],
        countryId: [null],
        provinceId: [null],
        cityId: [null, Validators.required],
      }),
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      // 1. Agregamos { emitEvent: false } para no disparar las suscripciones del ngOnInit
      this.profileForm.enable({ emitEvent: false });
      this.profileForm.get('email')?.disable({ emitEvent: false });

      // Habilitar cascada solo si ya hay valores
      if (!this.profileForm.get('address.countryId')?.value) {
        this.profileForm.get('address.provinceId')?.disable({ emitEvent: false });
        this.profileForm.get('address.cityId')?.disable({ emitEvent: false });
      }
    } else {
      const profile = this.profileResource.value();
      if (profile) this.populateForm(profile);

      // 2. Recomendable agregarlo acá también por consistencia
      this.profileForm.disable({ emitEvent: false });
    }
  }

  private populateForm(data: UserProfile): void {
    let birthDate = data.birthDate;
    if (birthDate && typeof birthDate === 'string') {
      birthDate = birthDate.split('T')[0];
    }

    const address = data.address;

    this.profileForm.patchValue({
      name: data.name || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      birthDate: birthDate || '',
      address: {
        street: address?.street || '',
        number: address?.number || '',
        postalCode: address?.postalCode || '',
      }
    });

    if (!address?.country) return;

    this.locationService.getCountries().subscribe(countries => {
      const country = countries.find(c =>
        c.name.toLowerCase() === address.country.toLowerCase()
      );
      if (!country) return;

      this.profileForm.get('address.countryId')!.setValue(country.id, { emitEvent: false });

      this.locationService.getProvincesByCountry(country.id).subscribe(provinces => {
        this.provinces.set(provinces);

        const province = provinces.find(p =>
          p.name.toLowerCase() === address.province?.toLowerCase()
        );
        if (!province) return;

        this.profileForm.get('address.provinceId')!.setValue(province.id, { emitEvent: false });

        this.locationService.getCitiesByProvince(province.id).subscribe(cities => {
          this.cities.set(cities);

          const city = cities.find(c =>
            c.name.toLowerCase() === address.city?.toLowerCase()
          );
          if (!city) return;

          this.profileForm.get('address.cityId')!.setValue(city.id, { emitEvent: false });
        });
      });
    });
  }

  onSubmit(): void {
    this.profileForm.markAllAsTouched();

    if (!this.profileForm.valid) {
      this.showValidationErrors();
      return;
    }

    this.isSaving = true;

    const rawValue = this.profileForm.getRawValue();
    const formData = {
      name: rawValue.name,
      lastName: rawValue.lastName,
      phone: rawValue.phone,
      birthDate: rawValue.birthDate,
      address: {
        street: rawValue.address.street,
        number: rawValue.address.number,
        postalCode: rawValue.address.postalCode,
        cityId: Number(rawValue.address.cityId),
      }
    };

    this.profileService.updateUserProfile(formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.profileForm.disable();

        if (this.tableSessionService.hasActiveSession()) {
          console.log('🔄 Actualizando nickname después de editar perfil');
          this.tableSessionService.refreshNickname();
        }

        this.profileResource.reload();
        this.showSuccessMessage();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al actualizar perfil:', error);
        this.showErrorMessage(error);
      },
    });
  }

  async deleteAccount() {
    const confirmedDelete = await this.sweetAlert.confirmCustomAction(
      'Eliminar cuenta',
      '¿Estás seguro? Esta acción es permanente y no se puede deshacer.'
    );

    if (!confirmedDelete) return;

    if (this.tableSessionService.hasActiveSession()) {

      const confirmedSession = await this.sweetAlert.confirmCustomAction(
        'Tenés una sesión activa',
        'Para eliminar tu cuenta, primero debés salir de la mesa. Si sos el último, la mesa se cerrará. ¿Continuar?'
      );

      if (!confirmedSession) return;

      this.sweetAlert.showLoading('Gestionando mesa...', 'Verificando estado de la sesión');

      try {
        const info = this.tableSessionService.tableSessionInfo();
        const isLastPerson = info && info.participantCount <= 1;

        if (isLastPerson) {
          await lastValueFrom(this.tableSessionService.closeSession());
        } else {
          await lastValueFrom(this.tableSessionService.leaveSession());
        }

      } catch (error: any) {
        console.error('Error al salir de la mesa:', error);
        const msg = error?.error?.message || 'No se pudo cerrar la sesión. La cuenta NO fue eliminada.';
        this.sweetAlert.showError('No se pudo eliminar', msg);
        return;
      }
    }

    this.performDeleteAccount();
  }

  private performDeleteAccount() {
    this.sweetAlert.showLoading('Eliminando cuenta...', 'Por favor esperá');

    this.profileService.deleteUser().subscribe({
      next: () => {
        this.sweetAlert.showSuccess(
          'Cuenta eliminada',
          'Tu usuario fue eliminado correctamente.',
          2000
        ).then(() => {
          this.executeCleanLogout();
        });
      },
      error: (err) => {
        console.error('Error eliminando user:', err);
        this.sweetAlert.showError(
          'Error',
          'Ocurrió un error al intentar borrar tu usuario.'
        );
      }
    });
  }

  private executeCleanLogout() {

    this.authService.logout().subscribe({
      next: () => {
        this.navigation.navigateToHome();
      },
      error: (err) => {
        console.error('Error en logout post-delete', err);
        this.navigation.navigateToHome();
      }
    });
  }
  private showValidationErrors(): void {
    const errors: string[] = [];

    Object.keys(this.profileForm.controls).forEach((key) => {
      const control = this.profileForm.get(key);
      if (control?.invalid && key !== 'address') {
        if (control.hasError('required')) {
          errors.push(`${this.getFieldName(key)} es requerido`);
        }
        if (control.hasError('minlength')) {
          errors.push(
            `${this.getFieldName(key)} debe tener al menos ${control.errors?.['minlength'].requiredLength
            } caracteres`
          );
        }
        if (control.hasError('pattern')) {
          errors.push(`${this.getFieldName(key)} tiene un formato inválido`);
        }
      }
    });

    const address = this.profileForm.get('address') as FormGroup;
    if (address.invalid) {
      Object.keys(address.controls).forEach((key) => {
        const control = address.get(key);
        if (control?.invalid) {
          if (control.hasError('required')) {
            errors.push(`${this.getFieldName(key)}(en dirección) es requerido`);
          }
          if (control.hasError('pattern')) {
            errors.push(
              `${this.getFieldName(key)}(en dirección) tiene formato inválido`
            );
          }
        }
      });
    }

    if (errors.length > 0) {
      const htmlErrors = `
        <ul class="list-disc list-inside text-left text-sm -ml-4">
          ${errors.map((e) => `<li>${e}</li>`).join('')}
        </ul>
      `;
      this.sweetAlert.showError('Campos incompletos', htmlErrors);
    }
  }

  private getFieldName(key: string): string {
    const names: { [key: string]: string } = {
      name: 'Nombre',
      lastName: 'Apellido',
      phone: 'Teléfono',
      birthDate: 'Fecha de nacimiento',
      street: 'Calle',
      number: 'Número',
      city: 'Ciudad',
      province: 'Provincia',
      country: 'País',
      postalCode: 'Código postal',
    };
    return names[key] || key;
  }

  private showSuccessMessage(): void {
    this.sweetAlert.showSuccess(
      '¡Listo!',
      'Tu perfil ha sido actualizado.',
      2000
    );
  }

  private showErrorMessage(error: any): void {
    const message =
      error?.error?.message ||
      'Error al actualizar el perfil. Por favor, intente nuevamente.';
    this.sweetAlert.showError('Ocurrió un Problema', message);
  }

  hasError(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.profileForm.get(field);
    if (!control?.errors) return '';

    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('minlength')) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.hasError('pattern')) {
      if (field === 'phone') return 'Solo dígitos y + al inicio. Ej: +5491122334455';
      if (field === 'address.postalCode') return 'Solo letras y números, sin espacios';
      if (field === 'address.street') return 'Nombre de calle inválido';
      if (field === 'address.number') return 'Solo letras y números';
      if (field === 'name' || field === 'lastName') return 'Solo letras, sin espacios dobles';
    }
    return 'Campo inválido';
  }
}
