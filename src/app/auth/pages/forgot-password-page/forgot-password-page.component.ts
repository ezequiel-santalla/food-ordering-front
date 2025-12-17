import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  KeyRound,
  LucideAngularModule,
  Mail,
  Send,
  X,
} from 'lucide-angular';
import { AuthService } from '../../services/auth-service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
 
  readonly KeyRound = KeyRound;
  readonly Mail = Mail;
  readonly Send = Send;
  readonly X = X;

 
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);

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

    this.authService.forgotPassword({ email: email }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.sweetAlertService.showSuccess(
          'Email Enviado',
          'Revisa tu bandeja de entrada (y spam) para ver las instrucciones.'
        );
        
        this.navigation.navigateToLogin();
      },
      error: (error) => {
        this.isSubmitting = false;
        const { title, message } = this.errorHandler.getAuthError(error);
        this.sweetAlertService.showError(title, message);
      },
    });
  }

  onExit() {
    this.navigation.navigateToHome();
  }
}
