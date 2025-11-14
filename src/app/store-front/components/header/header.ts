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
  // --- Servicios ---
  private menuService = inject(MenuService);
  tableSessionService = inject(TableSessionService);
  authService = inject(AuthService);
  private authState = inject(AuthStateManager);
  private router = inject(Router);

  // --- Íconos ---
  readonly Bell = Bell;
  readonly User = User;
  readonly UserCog = UserCog;
  readonly UtensilsCrossed = UtensilsCrossed;
  readonly Power = Power;
  readonly LogIn = LogIn;

  // --- Estado de Autenticación ---
  isAuthenticated = this.authState.isAuthenticated;
  isGuest = this.authState.isGuest;
  hasActiveSession = this.tableSessionService.hasActiveSession;

  // --- Datos de Sesión ---
  participantNickname = computed(() => {
    // Si está en sesión, muestra el nickname. Si no, "Hola" genérico.
    const nick = this.tableSessionService.tableSessionInfo().participantNickname;
    return nick || 'Invitado'; // O el nombre del usuario si está logueado
  });

  // Recurso para obtener el nombre y logo del local
  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });

  // ✅ NUEVO: Lógica para el logo del local
  venueImageUrl = computed(() => {
    // Devuelve la URL del logo o un ícono de fallback
    return this.menuResource.value()?.foodVenueImageUrl;
  });

  venueName = computed(() => {
    return this.menuResource.value()?.foodVenueName || 'Cargando...';
  });

  // --- Acciones del Desplegable ---
  onLeaveSession(): void {
    this.tableSessionService.leaveSession();
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
