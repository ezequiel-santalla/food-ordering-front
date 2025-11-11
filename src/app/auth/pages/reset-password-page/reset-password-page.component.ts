import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  KeyRound,
  LockKeyhole, // Ícono nuevo
  LucideAngularModule,
  Save,         // Ícono nuevo
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { first } from 'rxjs';

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
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute); // <-- Para leer la URL

  formUtils = FormUtils;
  isSubmitting = false;
  private token: string | null = null; // <-- Para almacenar el token

  resetForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, {
    // Validador a nivel de formulario para comparar contraseñas
    validators: [ FormUtils.passwordsMatchValidator ] 
  });

  ngOnInit(): void {
    // Leemos el token de la URL (ej: ?token=...)
    this.activatedRoute.queryParamMap
      .pipe(first()) // Solo nos interesa la primera vez
      .subscribe((params) => {
        this.token = params.get('token');

        if (!this.token) {
          // Si no hay token, no pueden estar aquí
          this.sweetAlertService.showError(
            'Token Inválido',
            'No se encontró un token de reseteo. Serás redirigido.'
          );
          this.router.navigate(['/auth/login']);
        }
      });
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    
    // Doble chequeo por si acaso
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

    // Llamamos al nuevo método del servicio
    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.sweetAlertService.showSuccess(
          '¡Éxito!',
          'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.'
        );
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isSubmitting = false;
        // El manejador de errores de auth debería servir
        const { title, message } = this.errorHandler.getGenericError(error);
        this.sweetAlertService.showError(title, message);
      },
    });
  }
}