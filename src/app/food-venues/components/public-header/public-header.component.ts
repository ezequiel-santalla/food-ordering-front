import {
  Component,
  inject,
  computed,
  Output,
  EventEmitter,
  signal,
  HostListener,
  ElementRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  Menu,
  QrCode,
  LogIn,
} from 'lucide-angular';
import { NavigationService } from '../../../shared/services/navigation.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { finalize } from 'rxjs';
import { TableSessionService } from '../../../store-front/services/table-session-service';
import { ProfileService } from '../../../store-front/services/profile-service';

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
  readonly Menu = Menu;
  readonly QrCode = QrCode;
  readonly LogIn = LogIn;

  private authService = inject(AuthService);
  private authState = inject(AuthStateManager);
  private navigation = inject(NavigationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private alertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);
  private profileService = inject(ProfileService);

  pictureUrl = signal<string | null>(null);

  @Output() navTo = new EventEmitter<string>();

  menuOpen = signal(false);
  isLoggedIn = this.authState.isAuthenticated;
  tableSessionId = this.authState.tableSessionId;

  hasValidTableSession = computed(() => {
    return SessionUtils.isValidSession(this.tableSessionId());
  });

  sHome = computed(
    () =>
      this.router.url === '/' ||
      this.router.url.startsWith('/?') ||
      this.router.url.startsWith('/#'),
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  ngOnInit() {
    this.router.events.subscribe(() => this.closeMenu());

    if (this.isLoggedIn()) {
      this.profileService.getUserProfile().subscribe({
        next: (profile) => this.pictureUrl.set(profile.pictureUrl ?? null),
        error: () => { }
      });
    }
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  goTo(sectionId: string) {
    this.navTo.emit(sectionId);
    this.closeMenu();
  }

  onScanQr() {
    this.closeMenu();
    this.navigation.navigateToScanner();
  }

  onLogin() {
    this.closeMenu();
    this.navigation.navigateToLogin?.();
  }

  async onLogout() {
    const hasActiveSession = this.tableSessionService.hasActiveSession();

    if (!hasActiveSession) {
      const confirmed = await this.alertService.confirm(
        '¿Cerrar sesión?',
        'Se finalizará tu sesión actual.',
        'Cerrar Sesión',
      );

      if (confirmed.isConfirmed) {
        this.executeLogout(true);
      }
      return;
    }

    const choice = await this.alertService.confirmLogoutWithActiveTable();

    if (choice === 'leave_and_logout') {
      this.handleLeaveAndLogout();
    }
  }

  private handleLeaveAndLogout() {
    const sessionInfo = this.tableSessionService.tableSessionInfo();
    const isLastPerson = sessionInfo.participantCount <= 1;

    let actionObservable;
    let loadingMessage = '';

    if (isLastPerson) {
      loadingMessage = 'Cerrando mesa y sesión...';
      actionObservable = this.tableSessionService.closeSession();
    } else {
      loadingMessage = 'Abandonando mesa y sesión...';
      actionObservable = this.tableSessionService.leaveSession();
    }

    this.alertService.showLoading(loadingMessage);

    actionObservable.subscribe({
      next: () => {
        this.executeLogout(false);
      },
      error: async (err: any) => {
        this.alertService.close();

        if (err?.status === 409) {
          const res = await this.alertService.showChoice(
            'No podés salir',
            'Tenés pedidos pendientes de pago. Pagalos antes de cerrar sesión.',
            'Pagar ahora',
            'Cancelar',
          );
          if (res.isConfirmed) {
            this.navigation.navigateToPayments({ section: 'pending' });
          }
          return;
        }
        this.alertService.showError('Error', 'No se pudo completar la acción.');
      },
    });
  }

  private executeLogout(showLoading: boolean) {
    if (showLoading) {
      this.alertService.showLoading('Saliendo...', 'Limpiando credenciales.');
    }

    this.authService
      .logout()
      .pipe(finalize(() => this.alertService.close()))
      .subscribe({
        next: () => this.handleLogoutSuccess(),
        error: (error) => {
          console.error('Error durante logout:', error);
          this.handleLogoutSuccess();
        },
      });
  }

  private handleLogoutSuccess(): void {
    this.navigation.navigateToLogin();
    this.alertService.showSuccess('Sesión cerrada', '¡Hasta pronto!');
  }

  navigateToScanner() {
    this.navigation.navigateToScanner();
  }

  isHome() {
    return this.router.url === '/' || this.router.url === '/home';
  }
}
