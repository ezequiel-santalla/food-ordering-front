import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  KeyRound,
  LucideAngularModule,
  Mail,
  Send, // Ícono para "Enviar"
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';

@Component({
  selector: 'app-forgot-password-page',
  // Asumo que sigues el patrón de 'standalone' e 'imports' del login
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
  // Íconos
  readonly KeyRound = KeyRound;
  readonly Mail = Mail;
  readonly Send = Send;

  // Servicios
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  formUtils = FormUtils;
  isSubmitting = false;

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { email } = this.forgotForm.value;

    this.sweetAlertService.showLoading(
      'Enviando...',
      'Por favor espera un momento'
    );

    // --- IMPORTANTE ---
    // Asumo que tu AuthService tiene un método `forgotPassword(email: string)`
    // que devuelve un Observable.
    this.authService.forgotPassword({ email: email }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.sweetAlertService.showSuccess(
          'Email Enviado',
          'Revisa tu bandeja de entrada (y spam) para ver las instrucciones.'
        );
        // Redirigimos al login
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isSubmitting = false;
        // Reutilizamos tu manejador de errores
        const { title, message } = this.errorHandler.getAuthError(error);
        this.sweetAlertService.showError(title, message);
      },
    });
  }
}
