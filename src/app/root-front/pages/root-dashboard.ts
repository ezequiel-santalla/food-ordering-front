import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  Store,
  Users,
  PlusCircle,
  LogOut,
  LayoutDashboard,
} from 'lucide-angular';
import { AuthService } from '../../auth/services/auth-service';
import { NavigationService } from '../../shared/services/navigation.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { AuthStateManager } from '../../auth/services/auth-state-manager-service';

@Component({
  selector: 'app-root-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
  ],
  templateUrl: './root-dashboard.html',
})
export class RootDashboardComponent {
  private authService = inject(AuthService);
  private navigationService = inject(NavigationService);
  private alertService = inject(SweetAlertService);
  private authState = inject(AuthStateManager);

  protected readonly Store = Store;
  protected readonly Users = Users;
  protected readonly PlusCircle = PlusCircle;
  protected readonly LogOut = LogOut;
  protected readonly LayoutDashboard = LayoutDashboard;

  public user = this.authService.currentUser;

  exitToRoleSelection(): void {
    this.navigationService.navigateToRoleSelection();
  }
  
  logout(): void {
    this.alertService
      .confirm(
        '¿Cerrar sesión?',
        'Se finalizará tu sesión actual en el panel administrativo.',
        'Cerrar Sesión',
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.alertService.showLoading(
            'Saliendo...',
            'Limpiando credenciales de acceso.',
          );

          this.authService.logout().subscribe({
            next: () => {
              this.handleLogoutSuccess();
            },
            error: (error) => {
              console.error('Error durante logout:', error);
              this.authState.clearState();
              this.handleLogoutSuccess();
            },
          });
        }
      });
  }

  private handleLogoutSuccess(): void {
    this.navigationService.navigateToLogin();
    this.alertService.showSuccess('Sesión cerrada', '¡Hasta pronto!');
  }
}
