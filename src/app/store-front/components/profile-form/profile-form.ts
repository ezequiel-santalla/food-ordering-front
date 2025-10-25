import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { TableSessionService } from '../../../store-front/services/table-session.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-form.html',
})
export class ProfileForm {
  private profileService = inject(ProfileService);
  private tableSessionService = inject(TableSessionService);
  private fb = inject(FormBuilder);

  profileForm!: FormGroup;
  isEditing = false;
  isSaving = false;

  profileResource = rxResource({
    stream: () => {
      return this.profileService.getUserProfile();
    }
  });

  constructor() {
    this.initForm();

    effect(() => {
      const profile = this.profileResource.value();
      if (profile) {
        this.populateForm(profile);
      }
    });
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      birthDate: ['', Validators.required],
      address: this.fb.group({
        street: ['', Validators.required],
        number: ['', Validators.required],
        city: ['', Validators.required],
        province: ['', Validators.required],
        country: ['', Validators.required],
        postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{4,10}$/)]]
      })
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (!this.isEditing) {
      const profile = this.profileResource.value();
      if (profile) {
        this.populateForm(profile);
      }
    }
  }

  private populateForm(data: any): void {
    let birthDate = data.birthDate;

    if (birthDate && typeof birthDate === 'string') {
      birthDate = birthDate.split('T')[0];
    }

    this.profileForm.patchValue({
      name: data.name || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      birthDate: birthDate || '',
      address: {
        street: data.address?.street || '',
        number: data.address?.number || '',
        city: data.address?.city || '',
        province: data.address?.province || '',
        country: data.address?.country || '',
        postalCode: data.address?.postalCode || ''
      }
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
      address: rawValue.address
    };

    this.profileService.updateUserProfile(formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;

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
      }
    });
  }

  private showValidationErrors(): void {
    const errors: string[] = [];

    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      if (control?.invalid && key !== 'address') {
        if (control.hasError('required')) {
          errors.push(`${this.getFieldName(key)} es requerido`);
        }
        if (control.hasError('minlength')) {
          errors.push(`${this.getFieldName(key)} debe tener al menos ${control.errors?.['minlength'].requiredLength} caracteres`);
        }
        if (control.hasError('pattern')) {
          errors.push(`${this.getFieldName(key)} tiene un formato inválido`);
        }
      }
    });

    const address = this.profileForm.get('address') as FormGroup;
    if (address) {
      Object.keys(address.controls).forEach(key => {
        const control = address.get(key);
        if (control?.invalid) {
          errors.push(`${this.getFieldName(key)} en la dirección es requerido`);
        }
      });
    }

    if (errors.length > 0) {
      alert(`Por favor corrija los siguientes errores:\n\n${errors.join('\n')}`);
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
      postalCode: 'Código postal'
    };
    return names[key] || key;
  }

  private showSuccessMessage(): void {
    alert('✅ Perfil actualizado con éxito');
  }

  private showErrorMessage(error: any): void {
    const message = error?.error?.message || 'Error al actualizar el perfil. Por favor, intente nuevamente.';
    alert(`❌ ${message}`);
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
    if (control.hasError('pattern')) {
      if (field === 'phone') return 'Formato: +54 11 1234-5678';
      if (field === 'address.postalCode') return 'Solo números, entre 4 y 10 dígitos';
    }
    return 'Campo inválido';
  }
}
