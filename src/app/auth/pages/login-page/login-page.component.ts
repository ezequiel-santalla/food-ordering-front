import { Component, inject, OnInit } from '@angular/core';
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
  X,
} from 'lucide-angular';
import { AuthService } from '../../services/auth-service';
import { FormUtils } from '../../../utils/form-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { TableSessionService } from '../../../store-front/services/table-session-service';
import { isTableSessionResponse, LoginResponse } from '../../models/auth';
import { JwtUtils } from '../../../utils/jwt-utils';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent implements OnInit {
  readonly User = User;
  readonly Mail = Mail;
  readonly KeyRound = KeyRound;
  readonly RotateCcwIcon = RotateCcwIcon;
  readonly X = X;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private errorHandler = inject(ErrorHandlerService);
  private navigation = inject(NavigationService);
  private initialTableSessionId: string | null = null;
  private wasGuest = false;

  ngOnInit(): void {
    // Captura el estado ANTES de que el usuario haga nada.
    this.initialTableSessionId = this.authService.tableSessionId();
    this.wasGuest = this.authService.isGuest();
  }

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

    this.authService.login(formValue, this.initialTableSessionId).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        const hasEmployments =
          'employments' in response &&
          response.employments &&
          response.employments.length > 0;

        if (this.wasGuest && !hasEmployments) {
          this.sweetAlertService.showSuccess(
            '¡Sesión Vinculada!',
            'Tu sesión de invitado ahora está vinculada a tu cuenta.'
          );
        } else {
          this.sweetAlertService.showSuccess(
            '¡Bienvenido!',
            'Has iniciado sesión correctamente.'
          );
        }

        this.processSuccessfulLogin(response);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isSubmitting = false;

        if (error.status === 409) {
          console.log(
            '⚠️ Conflicto 409. Sesión activa detectada en otra mesa.',
            error.error
          );

          this.sweetAlertService.showError(
            'Conflicto de Sesión',
            'Ya tenés una sesión activa en otra mesa. Se canceló el inicio de sesión.'
          );

          this.navigation.navigateBySessionState(1500);
        } else {
          const { title, message } = this.errorHandler.getAuthError(error);
          this.sweetAlertService.showError(title, message);
        }
      },
    });
  }

  onCancel() {
    this.resetForm();
  }

  /**
   * Método privado para manejar la respuesta de un login exitoso
   * (ya sea un 200 OK o un 409 Conflict con datos de sesión)
   */
  private processSuccessfulLogin(response: LoginResponse): void {

    // Comprueba y guarda la sesión SIEMPRE que exista.
    if (isTableSessionResponse(response)) {
      console.log('🪑 TableSessionResponse detectado en login');

      const decodedToken = JwtUtils.decodeJWT(response.accessToken);
      const participantIdFromToken = decodedToken?.participantId;

      console.log('🔍 ParticipantId del token:', participantIdFromToken);

      const currentParticipant = response.activeParticipants.find(
        (p) => p.publicId === participantIdFromToken
      );

      let nickname: string;

      if (currentParticipant) {
        // Prioriza el nombre de usuario, luego el nickname
        if (currentParticipant.user?.name) {
          nickname = currentParticipant.user.name;
          console.log('✅ Usando nombre del usuario:', nickname);
        } else if (currentParticipant.nickname) {
          nickname = currentParticipant.nickname;
          console.log('✅ Usando nickname del participante:', nickname);
        } else {
          nickname = 'Usuario';
          console.log('⚠️ Participante sin nickname ni nombre');
        }
      } else {
        nickname = 'Usuario';
        console.log('⚠️ Participante no encontrado en la lista');
      }

      console.log('👤 Nickname final:', nickname);

      this.tableSessionService.setTableSessionInfo(
        response.tableNumber,
        nickname,
        response.numberOfParticipants || 0,
        response.tableCapacity || 0,
        participantIdFromToken
      );

      console.log('✅ Datos de mesa guardados correctamente');
    } else {
      // AuthResponse sin mesa activa (ej. admin logueando sin sesión)
      console.log('👤 AuthResponse - Sin sesión de mesa activa');
    }

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
      return;
    }

    // 3. Si no hay roles, navega al estado de la sesión
    this.resetForm();
    this.navigation.navigateBySessionState();
  }

  onExit(){
    this.navigation.navigateBySessionState();
  }
}

