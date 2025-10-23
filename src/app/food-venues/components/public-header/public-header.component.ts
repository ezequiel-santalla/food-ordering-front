import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink],
  templateUrl: './public-header.component.html',
})
export class PublicHeaderComponent {

  authService = inject(AuthService);
  private router = inject(Router);

  isLoggedIn = this.authService.isAuthenticated;
  tableSessionId = this.authService.tableSessionId;

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.router.navigate(['/food-venues']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        // Incluso con error, se limpia localmente y se redirige
        this.router.navigate(['/food-venues']);
      }
    });
  }

  navigateToScanner(){
    this.router.navigate(['/scan-camera']);
  }
}
