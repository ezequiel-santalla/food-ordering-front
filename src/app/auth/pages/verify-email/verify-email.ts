import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule, Check, X, LoaderCircle, User, Send, CircleAlert } from 'lucide-angular';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './verify-email.html',
})
export class VerifyEmailComponent implements OnInit {

  readonly Check = Check;
  readonly X = X;
  readonly LoaderCircle = LoaderCircle;
  readonly User = User;
  readonly CircleAlert = CircleAlert;
  readonly Send = Send;

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  verificationState: 'loading' | 'success' | 'error' = 'loading';
  errorMessage: string = '';

  ngOnInit() {
    // Obtener el token de la URL
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.verificationState = 'error';
      this.errorMessage = 'No se encontró el token de verificación en la URL.';
      return;
    }

    // Hacer la petición de verificación
    this.verifyEmail(token);
  }

  private verifyEmail(token: string) {
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        console.log('✅ Email verificado exitosamente');
        this.verificationState = 'success';
      },
      error: (error) => {
        console.error('❌ Error verificando email:', error);
        this.verificationState = 'error';

        // Mensajes de error personalizados según el status
        if (error.status === 400) {
          this.errorMessage = 'El token de verificación es inválido o ha expirado.';
        } else if (error.status === 404) {
          this.errorMessage = 'No se encontró una cuenta asociada a este token.';
        } else if (error.status === 409) {
          this.errorMessage = 'Esta cuenta ya ha sido verificada.';
        } else {
          this.errorMessage = 'No se pudo verificar tu email. Por favor, intenta nuevamente.';
        }
      }
    });
  }
}
