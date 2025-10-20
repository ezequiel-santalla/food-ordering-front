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
  RotateCcwIcon,
  User,
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { TableSessionService } from '../../../store-front/services/table-session.service';
import { isTableSessionResponse } from '../../models/auth';
import { JwtUtils } from '../../../utils/jwt-utils';

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
      password: '',
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

        // PASO 1: Procesar la información de la sesión de mesa SIEMPRE que exista.
        if (isTableSessionResponse(response)) {
          console.log('🪑 TableSessionResponse detectado en login'); // Decodificar el token para obtener el participantId

          const decodedToken = JwtUtils.decodeJWT(response.accessToken);
          const participantIdFromToken = decodedToken?.participantId;

          console.log('🔍 ParticipantId del token:', participantIdFromToken); // Buscar el participante actual

          const currentParticipant = response.participants.find(
            (p) => p.publicId === participantIdFromToken
          ); // Determinar el nickname

          let nickname: string;

          if (currentParticipant) {
            if (currentParticipant.nickname) {
              nickname = currentParticipant.nickname;
              console.log('✅ Usando nickname del participante:', nickname);
            } else if (currentParticipant.user?.name) {
              nickname = currentParticipant.user.name;
              console.log('✅ Usando nombre del usuario:', nickname);
            } else {
              nickname = 'Usuario';
              console.log('⚠️ Participante sin nickname ni nombre');
            }
          } else {
            nickname = 'Usuario';
            console.log('⚠️ Participante no encontrado en la lista');
          }

          console.log('👤 Nickname final:', nickname); // Guardar en TableSessionService (actualiza signals y localStorage)

          this.tableSessionService.setTableSessionInfo(
            response.tableNumber,
            nickname,
            response.participants.length
          );

          console.log('✅ Datos de mesa guardados correctamente');
        } else {
          // AuthResponse sin mesa activa
          console.log('👤 AuthResponse - Sin sesión de mesa activa');
          localStorage.removeItem('participantNickname');
        }

        // PASO 2: Decidir a dónde navegar basándose en los roles.
        if (
          'employments' in response &&
          response.employments &&
          response.employments.length > 0
        ) {
          console.log(
            'PRIORIDAD 1: Roles detectados. Redirigiendo a selección...'
          );
          this.navigation.navigateToRoleSelection();
          this.resetForm();
          return; // Salimos para evitar doble navegación
        }

        // PASO 3: Si no hay roles, navegar según el estado de la sesión.
        this.resetForm();
        this.navigation.navigateBySessionState();
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isSubmitting = false;

        const { title, message } = this.errorHandler.getAuthError(error);
        this.sweetAlertService.showError(title, message);
      },
    });
  }

  onCancel() {
    this.resetForm();
  }
}
