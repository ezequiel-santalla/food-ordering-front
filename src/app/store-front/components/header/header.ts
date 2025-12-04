import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Bell,
  User,
  UserCog,
  Power,
  LogIn,
  UtensilsCrossed,
} from 'lucide-angular';
import { MenuService } from '../../services/menu-service';
import { TableSessionService } from '../../services/table-session-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth-service';
import { AuthStateManager } from '../../../auth/services/auth-state-manager-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './header.html',
})
export class Header {
  private menuService = inject(MenuService);
  tableSessionService = inject(TableSessionService);
  authService = inject(AuthService);
  private authState = inject(AuthStateManager);
  private router = inject(Router);

  readonly Bell = Bell;
  readonly User = User;
  readonly UserCog = UserCog;
  readonly UtensilsCrossed = UtensilsCrossed;
  readonly Power = Power;
  readonly LogIn = LogIn;

  isAuthenticated = this.authState.isAuthenticated;
  isGuest = this.authState.isGuest;
  hasActiveSession = this.tableSessionService.hasActiveSession;

  participantNickname = computed(() => {
    const nick = this.tableSessionService.tableSessionInfo().participantNickname;
    return nick || 'Invitado';
  });

  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });

  venueImageUrl = computed(() => {
    
    return this.menuResource.value()?.foodVenueImageUrl;
  });

  venueName = computed(() => {
    return this.menuResource.value()?.foodVenueName || 'Cargando...';
  });

  onLeaveSession(): void {
    this.tableSessionService.leaveSession();
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
