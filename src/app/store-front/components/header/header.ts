import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
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
  readonly User = User;
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

  onLogout(): void {
    const hasActiveSession = this.tableSessionService.hasActiveSession();

    if (!hasActiveSession) {
      this.executeLogout(true);
      return;
    }

    Swal.fire({
      title: 'Sesión de mesa activa',
      text: '¿Qué te gustaría hacer con la mesa al cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,

      confirmButtonText: 'Abandonar mesa y salir',
      confirmButtonColor: '#d33',

      denyButtonText: 'Solo salir (Mantener mesa)',
      denyButtonColor: '#3085d6',

      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.handleLeaveAndLogout();
      } else if (result.isDenied) {
        this.executeLogout(true);
      }
    });
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
      error: (err) => {
        console.error('⚠️ Error en acción de mesa, forzando logout...', err);
        this.executeLogout(false);
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
        this.sweetAlert.showSuccess('Listo', successMessage);
        this.navigation.navigateToHome();
      },
      error: () => {
        this.sweetAlert.showError('Error', 'No se pudo completar la acción.');
      },
    });
  }
}
