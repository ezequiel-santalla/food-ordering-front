import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KeyRound, LucideAngularModule, Mail, RotateCcwIcon, User } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {

  readonly User = User;
  readonly Mail = Mail;
  readonly KeyRound = KeyRound;
  readonly RotateCcwIcon = RotateCcwIcon;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sweetAlertService = inject(SweetAlertService);

  get pageTitle(): string {
    return 'Iniciar Sesión';
  }

  get pageSubtitle(): string {
    return 'Accede a tu cuenta';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return 'Iniciando sesión...';
    }
    return 'Iniciar Sesión';
  }

  get cancelButtonText(): string {
    return 'Limpiar';
  }

  formUtils = FormUtils;

  isSubmitting = false;

  myForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private resetForm() {
    this.myForm.reset();

    this.myForm.patchValue({
      email: '',
      password: ''
    });
  }

  async onSubmit() {
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      return;
    }

    const formValue = this.myForm.getRawValue();
    this.isSubmitting = true;

    this.sweetAlertService.showLoading(
      'Iniciando sesión...',
      'Por favor espera mientras verificamos tus credenciales'
    );

    this.authService.login(formValue).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        console.log('🎯 Login completado, verificando tableSessionId...');

        this.sweetAlertService.showSuccess(
          '¡Bienvenido!',
          'Has iniciado sesión correctamente.'
        );

        this.resetForm();

        // ⚠️ CRÍTICO: Esperar un tick para asegurar que los signals se actualicen
        setTimeout(() => {
          const hasTableSession = this.authService.tableSessionId();

          console.log('🔍 Estado después del login:', {
            tableSessionId: hasTableSession,
            foodVenueId: this.authService.foodVenueId()
          });

          if (hasTableSession) {
            console.log('✅ Tiene sesión de mesa, navegando a home');
            this.router.navigate(['/'], { replaceUrl: true });
          } else {
            console.log('⚠️ Sin sesión de mesa, navegando a scan-qr');
            this.router.navigate(['/scan-qr'], { replaceUrl: true });
          }
        }, 50);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isSubmitting = false;
        const { title, message } = this.getErrorMessage(error);
        this.sweetAlertService.showError(title, message);
      }
    });
  }

  onCancel() {
    this.resetForm();
  }

  private getErrorMessage(error: any): { title: string, message: string } {
    switch (error.status) {
      case 401:
        return {
          title: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos. Por favor, verifica tus datos.'
        };
      case 404:
        return {
          title: 'Usuario no encontrado',
          message: 'No existe una cuenta asociada a este email.'
        };
      case 403:
        return {
          title: 'Acceso denegado',
          message: 'Tu cuenta podría estar bloqueada o inactiva.'
        };
      case 0:
        return {
          title: 'Sin conexión',
          message: 'No se puede conectar al servidor. Verifica tu conexión a internet.'
        };
      default:
        if (error.status >= 500) {
          return {
            title: 'Error del servidor',
            message: 'Error interno del servidor. Intenta más tarde.'
          };
        }
        return {
          title: 'Error al iniciar sesión',
          message: 'No se pudo iniciar sesión. Verifica tus credenciales.'
        };
    }
  }
}
