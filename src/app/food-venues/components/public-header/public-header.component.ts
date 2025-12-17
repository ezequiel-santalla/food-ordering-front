import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth-service';
import { SessionUtils } from '../../../utils/session-utils';
import { AuthStateManager } from '../../../auth/services/auth-state-manager-service';
import {
  Bell,
  LogOut,
  User,
  LucideAngularModule,
  Utensils,
  House,
} from 'lucide-angular';
import { NavigationService } from '../../../shared/services/navigation.service';

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
  private navigation = inject(NavigationService);

  isLoggedIn = this.authState.isAuthenticated;
  tableSessionId = this.authState.tableSessionId;

  hasValidTableSession = computed(() => {
    return SessionUtils.isValidSession(this.tableSessionId());
  });

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.navigation.navigateToHome();
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        this.authState.clearState();
        this.navigation.navigateToHome();
      },
    });
  }

  navigateToScanner() {
    this.navigation.navigateToScanner();
  }
}
