import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  KeyRound,
  LockKeyhole, // Ícono nuevo
  LucideAngularModule,
  Save,         // Ícono nuevo
} from 'lucide-angular';
import { AuthService } from '../../services/auth-service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { first } from 'rxjs';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent implements OnInit {
  // Íconos
  readonly KeyRound = KeyRound;
  readonly LockKeyhole = LockKeyhole;
  readonly Save = Save;

  // Servicios
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);
  private activatedRoute = inject(ActivatedRoute);

  formUtils = FormUtils;
  isSubmitting = false;
  private token: string | null = null;

  resetForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, {
    
    validators: [ FormUtils.passwordsMatchValidator ]
  });

  ngOnInit(): void {
    
    this.activatedRoute.queryParamMap
      .pipe(first())
      .subscribe((params) => {
        this.token = params.get('token');

        if (!this.token) {
          
          this.sweetAlertService.showError(
            'Token Inválido',
            'No se encontró un token de reseteo. Serás redirigido.'
          );
          this.navigation.navigateToLogin();
        }
      });
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
       this.sweetAlertService.showError('Error Inesperado', 'No se encontró el token.');
       return;
    }

    this.isSubmitting = true;
    const { password } = this.resetForm.value;

    this.sweetAlertService.showLoading(
      'Actualizando...',
      'Por favor espera un momento'
    );

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.sweetAlertService.showSuccess(
          '¡Éxito!',
          'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.'
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
}
