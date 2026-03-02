import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Bell,
  UserCog,
  Power,
  LogIn,
  UtensilsCrossed,
  TextAlignJustify,
} from 'lucide-angular';
import { MenuService } from '../../services/menu-service';
import { TableSessionService } from '../../services/table-session-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth-service';
import { AuthStateManager } from '../../../auth/services/auth-state-manager-service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { finalize } from 'rxjs';
import { NavigationService } from '../../../shared/services/navigation.service';
import { NotificationDropdownComponent } from '../notifications/notification-dropdown';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NotificationDropdownComponent,
  ],
  templateUrl: './header.html',
})
export class Header {
  private menuService = inject(MenuService);
  tableSessionService = inject(TableSessionService);
  authService = inject(AuthService);
  private authState = inject(AuthStateManager);
  private navigation = inject(NavigationService);
  private sweetAlert = inject(SweetAlertService);

  readonly Bell = Bell;
  readonly User = TextAlignJustify;
  readonly UserCog = UserCog;
  readonly UtensilsCrossed = UtensilsCrossed;
  readonly Power = Power;
  readonly LogIn = LogIn;

  isAuthenticated = this.authState.isAuthenticated;
  isGuest = this.authState.isGuest;
  hasActiveSession = this.tableSessionService.hasActiveSession;

  participantNickname = computed(() => {
    const nick =
      this.tableSessionService.tableSessionInfo().participantNickname;
    return nick || 'Invitado';
  });

  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });

  venueImageUrl = computed(() => this.menuResource.value()?.foodVenueImageUrl);
  venueName = computed(
    () => this.menuResource.value()?.foodVenueName || 'Cargando...',
  );

  async onLogout() {
    const hasActiveSession = this.tableSessionService.hasActiveSession();

    if (!hasActiveSession) {
      const res = await this.sweetAlert.confirm(
        '¿Cerrar sesión?',
        'Se finalizará tu sesión actual.',
      );
      if (res.isConfirmed) this.executeLogout(true);
      return;
    }

    const choice = await this.sweetAlert.confirmLogoutWithActiveTable();
    if (choice === 'leave_and_logout') {
      this.handleTableExit(true);
    }
  }

  onLeaveSession(): void {
    const count = this.tableSessionService.tableSessionInfo().participantCount;
    const isLast = count <= 1;

    this.sweetAlert
      .showChoice(
        isLast ? '¿Cerrar la mesa?' : '¿Abandonar la mesa?',
        isLast
          ? 'Sos el último participante. La mesa se cerrará.'
          : 'La mesa seguirá abierta para el resto.',
        isLast ? 'Sí, cerrar mesa' : 'Sí, abandonar',
        'Cancelar',
      )
      .then((res) => {
        if (res.isConfirmed) {
          this.handleTableExit(false);
        }
      });
  }

  private handleTableExit(isLogoutContext: boolean) {
    const count = this.tableSessionService.tableSessionInfo().participantCount;
    const isLastPerson = count <= 1;

    const actionObservable = isLastPerson
      ? this.tableSessionService.closeSession()
      : this.tableSessionService.leaveSession();

    this.sweetAlert.showLoading(
      isLastPerson ? 'Cerrando mesa...' : 'Abandonando mesa...',
    );

    actionObservable.subscribe({
      next: () => {
        if (isLogoutContext) {
          this.executeLogout(false);
        } else {
          this.sweetAlert.close();
          this.sweetAlert.showSuccess('Has salido de la mesa', '', 1500);
          this.navigation.navigateToHome();
        }
      },
      error: async (err: any) => {
        this.sweetAlert.close();

        if (err?.status === 409) {
          const res = await this.sweetAlert.showChoice(
            'No podés salir',
            'Tenés pedidos pendientes de pago.',
            'Pagar ahora',
            'Cancelar',
          );
          if (res.isConfirmed) {
            this.navigation.navigateToPayments({ section: 'pending' });
          }
          return;
        }

        console.warn('Error técnico en mesa, forzando salida:', err);

        if (isLogoutContext) {
          this.executeLogout(false);
        } else {
          this.tableSessionService.clearSession();
          this.navigation.navigateToHome();
        }
      },
    });
  }

  private executeLogout(showLoading: boolean) {
    if (showLoading) this.sweetAlert.showLoading('Cerrando sesión...');

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.sweetAlert.close();
          this.navigation.navigateToHome();
        }),
      )
      .subscribe({
        error: () => {},
      });
  }
}
