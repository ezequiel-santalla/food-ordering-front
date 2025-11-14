import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Mail,
  RotateCcwIcon,
  Send,
  X,
} from 'lucide-angular';
import { AuthService } from '../../services/auth-service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-resend-email-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './resend-email-page.component.html',
})
export class ResendEmailPageComponent {
  readonly Mail = Mail;
  readonly Send = Send;
  readonly RotateCcwIcon = RotateCcwIcon;
  readonly X = X;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

  formUtils = FormUtils;
  isSubmitting = false;

  myForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private resetForm() {
    this.myForm.reset();
  }

  onSubmit() {
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      return;
    }

    const email = this.myForm.getRawValue().email;
    this.isSubmitting = true;

    this.sweetAlertService.showLoading(
      'Reenviando correo...',
      'Por favor espera'
    );

    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.sweetAlertService.showConfirmableSuccess(
          '¡Correo enviado!',
          `Revisa tu correo ${email} para activar tu cuenta.`,
          'Entendido'
        );
        this.resetForm();
      },
      error: (error) => {
        console.error('Error reenviando email:', error);
        this.isSubmitting = false;

        const { title, message } = this.errorHandler.getGenericError(
          error,
          'reenviar el correo'
        );
        this.sweetAlertService.showError(title, message);
      },
    });
  }

  onCancel() {
    this.resetForm();
  }

  onExit() {
    this.navigation.navigateBySessionState();
  }
}
