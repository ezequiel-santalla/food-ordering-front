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
    this.router.events.subscribe(() => {
      this.closeMenu();
    });
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

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.navigation.navigateToHome();
      },
      error: (error) => {
        this.authState.clearState();
        this.navigation.navigateToHome();
      },
    });
  }

  navigateToScanner() {
    this.navigation.navigateToScanner();
  }

  isHome() {
    return this.router.url === '/' || this.router.url === '/home';
  }
}
