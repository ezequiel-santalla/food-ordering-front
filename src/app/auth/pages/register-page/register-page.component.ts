import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KeyRound, LucideAngularModule, Mail, RotateCcwIcon, User, Phone, MapPin } from 'lucide-angular';
import { AuthService } from '../../services/auth-service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {

  readonly User = User;
  readonly Mail = Mail;
  readonly KeyRound = KeyRound;
  readonly RotateCcwIcon = RotateCcwIcon;
  readonly Phone = Phone;
  readonly MapPin = MapPin;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  get pageTitle(): string {
    return 'Crear Cuenta';
  }

  get pageSubtitle(): string {
    return 'Únete a nosotros';
  }

  get submitButtonText(): string {
    return this.isSubmitting ? 'Registrando...' : 'Registrarse';
  }

  get cancelButtonText(): string {
    return 'Limpiar';
  }

  formUtils = FormUtils;
  isSubmitting = false;
  showOptionalFields = false;

  registerForm: FormGroup = this.fb.group({
    // Campos requeridos
    name: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],

    // Campos opcionales
    phone: [''],
    birthDate: [''],

    // Dirección (opcional)
    street: [''],
    number: [''],
    city: [''],
    province: [''],
    country: [''],
    postalCode: [''],
  });

  private resetForm() {
    this.registerForm.reset();
  }

  toggleOptionalFields() {
    this.showOptionalFields = !this.showOptionalFields;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();
    this.isSubmitting = true;

    this.sweetAlertService.showLoading(
      'Creando cuenta...',
      'Por favor espera mientras registramos tu cuenta'
    );

    // Preparar datos del registro
    const registerData = this.buildRegisterData(formValue);

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isSubmitting = false;

        Swal.fire({
          title: '¡Cuenta creada!',
          html: `Revisa tu correo <strong>${formValue.email}</strong><br>para activar tu cuenta.`,
          icon: 'success',
          confirmButtonText: 'Entendido',
        }).then(() => {
          this.router.navigate(['/auth/login']);
        });

        this.resetForm();
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.isSubmitting = false;

        const { title, message } = this.errorHandler.getAuthError(error);
        this.sweetAlertService.showError(title, message);
      }
    });
  }

  onCancel() {
    this.resetForm();
    this.showOptionalFields = false;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private buildRegisterData(formValue: any) {
    // Campos requeridos
    const data: any = {
      name: formValue.name.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      password: formValue.password,
    };

    // Agregar teléfono solo si está presente y es válido
    if (formValue.phone?.trim()) {
      const phone = FormUtils.formatPhoneNumber(formValue.phone.trim());
      if (phone) {
        data.phone = phone;
      }
    }

    if (formValue.birthDate) {
      data.birthDate = formValue.birthDate;
    }

    // Agregar dirección solo si tiene al menos un campo
    const hasAddress = formValue.street?.trim() ||
      formValue.city?.trim() ||
      formValue.country?.trim();

    if (hasAddress) {
      data.address = {
        street: formValue.street?.trim() || '',
        number: formValue.number?.trim() || '',
        city: formValue.city?.trim() || '',
        province: formValue.province?.trim() || '',
        country: formValue.country?.trim() || '',
        postalCode: formValue.postalCode?.trim() || '',
      };
    }

    console.log('📤 Datos a enviar:', data);
    return data;
  }
}
