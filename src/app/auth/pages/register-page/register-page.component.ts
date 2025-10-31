import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KeyRound, LucideAngularModule, Mail, RotateCcwIcon, User, Phone, MapPin } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { TableSessionService } from '../../../store-front/services/table-session.service';
import { isTableSessionResponse } from '../../models/auth';
import { JwtUtils } from '../../../utils/jwt-utils';

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
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

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
      next: (response) => {
        this.isSubmitting = false;

        this.sweetAlertService.showSuccess(
          '¡Cuenta creada!',
          'Tu cuenta ha sido registrada correctamente.'
        );

        // Verificar si es una respuesta con sesión de mesa
        if (isTableSessionResponse(response)) {
          console.log('🪑 TableSessionResponse detectado en registro');

          const decodedToken = JwtUtils.decodeJWT(response.accessToken);
          const participantIdFromToken = decodedToken?.participantId;

          console.log('🔍 ParticipantId del token:', participantIdFromToken);

          const currentParticipant = response.activeParticipants.find(
            p => p.publicId === participantIdFromToken
          );

          let nickname: string;

          if (currentParticipant) {
            if (currentParticipant.nickname) {
              nickname = currentParticipant.nickname;
              console.log('✅ Usando nickname del participante:', nickname);
            } else if (currentParticipant.user?.name) {
              nickname = currentParticipant.user.name;
              console.log('✅ Usando nombre del usuario:', nickname);
            } else {
              nickname = formValue.name;
              console.log('⚠️ Participante sin nickname ni nombre');
            }
          } else {
            nickname = formValue.name;
            console.log('⚠️ Participante no encontrado en la lista');
          }

          console.log('👤 Nickname final:', nickname);

          this.tableSessionService.setTableSessionInfo(
            response.tableNumber,
            nickname,
            response.numberOfParticipants || 0
          );

          console.log('✅ Datos de mesa guardados correctamente');
        } else {
          console.log('👤 AuthResponse - Sin sesión de mesa activa');
          localStorage.removeItem('participantNickname');
        }

        this.resetForm();
        this.navigation.navigateBySessionState();
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

  // En register-page.component.ts

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
