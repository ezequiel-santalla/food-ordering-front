import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { SessionUtils } from '../../../utils/session-utils';
import { AuthStateManager } from '../../../auth/services/auth-state-manager.service';
import {
  Bell,
  LogOut,
  User,
  LucideAngularModule,
  Utensils,
  House,
} from 'lucide-angular';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './public-header.component.html',
})
export class PublicHeaderComponent {
  readonly Bell = Bell;
  readonly User = User;
  readonly Logout = LogOut;
  readonly Utensils = Utensils;
  readonly House = House;

  authService = inject(AuthService);
  private authState = inject(AuthStateManager);
  private router = inject(Router);

  isLoggedIn = this.authState.isAuthenticated;
  tableSessionId = this.authState.tableSessionId;

  // Computed que valida si la sesión es realmente válida
  hasValidTableSession = computed(() => {
    return SessionUtils.isValidSession(this.tableSessionId());
  });

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.router.navigate(['/food-venues']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        this.authState.clearState();
        this.router.navigate(['/food-venues']);
      },
    });
  }

  navigateToScanner() {
    this.router.navigate(['/scan-camera']);
  }
}
