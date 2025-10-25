import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { SessionUtils } from '../../../utils/session-utils';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink],
  templateUrl: './public-header.component.html',
})
export class PublicHeaderComponent {

  authService = inject(AuthService);
  private router = inject(Router);

  isLoggedIn = this.authService.isAuthenticated;

  // Computed que valida si la sesión es realmente válida
  hasValidTableSession = computed(() => {
    const tableSessionId = this.authService.tableSessionId();
    return SessionUtils.isValidSession(tableSessionId);
  });

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.router.navigate(['/food-venues']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        this.router.navigate(['/food-venues']);
      }
    });
  }

  navigateToScanner(){
    this.router.navigate(['/scan-camera']);
  }
}
