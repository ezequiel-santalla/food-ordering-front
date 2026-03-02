import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth-service';
import {
  LucideAngularModule,
  LayoutDashboard,
  ClipboardList,
  CircleDollarSign,
  Menu,
  X,
  Package,
  LayoutGrid,
  Tags,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  TrendingUpIcon,
  ShieldCheck,
} from 'lucide-angular';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { take } from 'rxjs';
import { NavigationService } from '../../../shared/services/navigation.service';
import { RootApiService } from '../../../root-front/services/root-api.service';

@Component({
  selector: 'app-admin-mobile-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-mobile-nav.html',
  styleUrl: './admin-mobile-nav.css',
})
export class AdminMobileNav {
  private alertService = inject(SweetAlertService);
  // Icons
  readonly dashboardIcon = LayoutDashboard;
  readonly clipboardIcon = ClipboardList;
  readonly dollarIcon = CircleDollarSign;
  readonly menuIcon = Menu;
  readonly closeIcon = X;
  readonly packageIcon = Package;
  readonly gridIcon = LayoutGrid;
  readonly tagsIcon = Tags;
  readonly usersIcon = Users;
  readonly settingsIcon = Settings;
  readonly logOutIcon = LogOut;
  readonly chevronIcon = ChevronDown;
  readonly trendingUpIcon = TrendingUpIcon;
  readonly shieldIcon = ShieldCheck;

  // Estado del menú expandido
  isMenuExpanded = false;
  isRootUser = computed(() => this.authService.role() === 'ROLE_ROOT');

  constructor(
    private authService: AuthService,
    private router: Router,
    private navigator: NavigationService,
    private rootApi: RootApiService,
  ) {}

  returnToRoot() {
    this.alertService.showLoading('Restaurando privilegios Root...');

    this.rootApi
      .selectContext()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.authService.applyAuthData(response);

          this.closeMenu();
          this.navigator.navigateToRootDashboard();
          this.alertService.showSuccess(
            'Modo Global',
            'Has recuperado tus permisos de Root.',
          );
        },
        error: (err) => {
          console.error('❌ Error al cambiar contexto:', err);
        },
      });
  }

  private tryFallbackSelectRole(publicId: string) {
    this.authService
      .selectRole(publicId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.closeMenu();
          this.navigator.navigateToRootDashboard();
        },
        error: () =>
          this.alertService.showError(
            'Error',
            'No se pudo recuperar el acceso.',
          ),
      });
  }

  toggleMenu() {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu() {
    this.isMenuExpanded = false;
  }

  onLinkClick() {
    // Cerrar menú al navegar
    this.closeMenu();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        this.router.navigate(['/']);
      },
    });
  }
}
