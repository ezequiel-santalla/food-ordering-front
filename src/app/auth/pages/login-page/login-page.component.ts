import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KeyRound, LucideAngularModule, Mail, RotateCcwIcon, User } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { TableSessionService } from '../../../store-front/services/table-session.service';

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
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

  get pageTitle(): string {
    return 'Iniciar Sesión';
  }

  get pageSubtitle(): string {
    return 'Accede a tu cuenta';
  }

  get submitButtonText(): string {
    return this.isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión';
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

        this.sweetAlertService.showSuccess(
          '¡Bienvenido!',
          'Has iniciado sesión correctamente.'
        );

        if (this.tableSessionService.hasActiveSession()) {
          this.tableSessionService.setTableSessionInfo(
            response.tableNumber,
            response.participants.length
          );
        }

        this.resetForm();

        // Navegar según estado de sesión
        this.navigation.navigateBySessionState();
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isSubmitting = false;

        const { title, message } = this.errorHandler.getAuthError(error);
        this.sweetAlertService.showError(title, message);
      }
    });
  }

  onCancel() {
    this.resetForm();
  }
}
