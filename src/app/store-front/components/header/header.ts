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
    () => this.menuResource.value()?.foodVenueName || 'Cargando...'
  );

  async onLogout() {
    const hasActiveSession = this.tableSessionService.hasActiveSession();

    if (!hasActiveSession) {
      this.executeLogout(true);
      return;
    }

    const choice = await this.sweetAlert.confirmLogoutWithActiveTable();

    if (choice === 'leave_and_logout') {
      this.handleLeaveAndLogout();
    } else if (choice === 'logout_only') {
      this.executeLogout(true);
    }
  }

  private handleLeaveAndLogout() {
    const count = this.tableSessionService.tableSessionInfo().participantCount;
    const isLastPerson = count <= 1;

    let actionObservable;
    let loadingMessage = '';

    if (isLastPerson) {
      loadingMessage = 'Cerrando mesa y sesión...';
      actionObservable = this.tableSessionService.closeSession();
    } else {
      loadingMessage = 'Abandonando mesa y sesión...';
      actionObservable = this.tableSessionService.leaveSession();
    }

    this.sweetAlert.showLoading(loadingMessage);

    actionObservable.subscribe({
      next: () => {
        console.log('✅ Acción de mesa completada. Procediendo al logout...');
        this.executeLogout(false);
      },
      error: async (err: any) => {
        this.sweetAlert.close();

        if (err?.status === 409) {
          const res = await this.sweetAlert.showChoice(
            'No podés salir',
            'Tenés pedidos pendientes de pago. Pagalos antes de cerrar sesión.',
            'Pagar ahora',
            'Cancelar',
          );
          if (res.isConfirmed) {
            this.navigation.navigateToPayments();
          }
          return;
        }
        this.sweetAlert.showError('Error', 'No se pudo completar la acción.');
      },
    });
  }

  private executeLogout(showLoading: boolean) {
    if (showLoading) {
      this.sweetAlert.showLoading(
        'Cerrando sesión...',
        'Limpiando datos seguros'
      );
    }

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.sweetAlert.close();
        })
      )
      .subscribe({
        next: () => {
          this.navigation.navigateToHome();
        },
        error: (err) => {
          this.navigation.navigateToHome();
        },
      });
  }

  onLeaveSession(): void {
    const count = this.tableSessionService.tableSessionInfo().participantCount;

    if (count <= 1) {
      this.sweetAlert
        .showChoice(
          '¿Cerrar la mesa?',
          'Sos el último participante. La mesa se cerrará para todos.',
          'Sí, cerrar mesa',
          'Cancelar'
        )
        .then((res) => {
          if (res.isConfirmed)
            this.performTableAction(
              this.tableSessionService.closeSession(),
              'Mesa cerrada'
            );
        });
    } else {
      this.sweetAlert
        .showChoice(
          '¿Abandonar la mesa?',
          'Dejarás de participar, pero la mesa sigue abierta para el resto.',
          'Sí, abandonar',
          'Cancelar'
        )
        .then((res) => {
          if (res.isConfirmed)
            this.performTableAction(
              this.tableSessionService.leaveSession(),
              'Has abandonado la mesa'
            );
        });
    }
  }

  private performTableAction(observableAction: any, successMessage: string) {
    this.sweetAlert.showLoading('Procesando...');
    observableAction.subscribe({
      next: () => {
        this.sweetAlert.close();
        this.sweetAlert.showSuccess(successMessage, '', 1500);
        this.navigation.navigateToHome();
      },
      error: async (err: any) => {
        this.sweetAlert.close();

        if (err?.status === 409) {
          const res = await this.sweetAlert.showChoice(
            'No podés abandonar la mesa',
            'Tenés pedidos pendientes de pago. Pagalos antes de salir.',
            'Pagar ahora',
            'Cancelar',
          );
          if (res.isConfirmed) {
            this.navigation.navigateToPayments();
          }
          return;
        }

       this.sweetAlert.showError(
          'Error',
          'No se pudo completar la acción.'
        );
      },
    });
  }
}
