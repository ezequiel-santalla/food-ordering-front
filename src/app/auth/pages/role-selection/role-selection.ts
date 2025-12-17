import { Component, computed, inject, effect, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { Employment } from '../../../shared/models/common';
import {
  Briefcase,
  ChefHat,
  LucideAngularModule,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../shared/services/navigation.service';
import { SessionUtils } from '../../../utils/session-utils';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { TableSessionService } from '../../../store-front/services/table-session-service';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './role-selection.html',
})
export class RoleSelectionComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private navigationService = inject(NavigationService);
  private sweetAlertService = inject(SweetAlertService);
  private tableSessionService = inject(TableSessionService);

  protected readonly User = User;
  protected readonly Briefcase = Briefcase;
  protected readonly ChefHat = ChefHat;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly ShieldAlert = ShieldAlert;

  public employments: Signal<Employment[]> = this.authService.employments;
  public hasEmployments = computed(() => this.employments().length > 0);
  public authStatus = this.authService.authStatus;

  public roleDisplayNames: { [key: string]: string } = {
    ROLE_ROOT: 'Superusuario',
    ROLE_ADMIN: 'Administrador',
    ROLE_MANAGER: 'Encargado',
    ROLE_STAFF: 'Empleado',
  };

  public getIconForRole(role: string): { icon: any; colorClass: string } {
    switch (role) {
      case 'ROLE_STAFF':
        return { icon: this.ChefHat, colorClass: 'text-success' };
      case 'ROLE_MANAGER':
        return { icon: this.Briefcase, colorClass: 'text-info' };
      case 'ROLE_ADMIN':
        return { icon: this.ShieldCheck, colorClass: 'text-warning' };
      case 'ROLE_ROOT':
        return { icon: this.ShieldAlert, colorClass: 'text-error' };
      default:
        return { icon: this.User, colorClass: 'text-accent' };
    }
  }

  constructor() {
    console.log('Cargando selector de roles');

    effect(() => {
      const status = this.authStatus();

      if (status === 'authenticated' && !this.hasEmployments()) {
        console.warn('Usuario autenticado sin roles. Redirigiendo al login.');
        this.navigationService.navigateToLogin();
      }
    });
  }

  selectEmployment(employment: Employment): void {
    this.authService.selectRole(employment.publicId).subscribe({
      next: () => {
        console.log(`Rol de ${employment.role} seleccionado. Redirigiendo...`);
        const role = employment.role;

        if (role === 'ROLE_ADMIN') {
          this.router.navigate(['admin']);
        } else if (role === 'ROLE_MANAGER' || role === 'ROLE_STAFF') {
          this.router.navigate(['employee']);
        }
      },
      error: (err) => {
        console.error('Error al seleccionar el rol', err);
      },
    });
  }

  continueAsClient(): void {
    console.log('Continuando como cliente...');

    const tableSessionId = this.authService.tableSessionId();

    if (SessionUtils.isValidSession(tableSessionId)) {
      console.log('Ya tiene sesión de mesa, navegando a home');
      this.sweetAlertService.showInfo(
        'Sesión Activa',
        'Ya tenías una sesión de mesa activa. Te redirigiremos allí.'
      );

      this.tableSessionService.recoverActiveSession().subscribe({
        next: (info) => {
          this.sweetAlertService.close();
          this.sweetAlertService.showInfo(
            'Sesión Restaurada',
            `Estás en la mesa ${info.tableNumber}`
          );

          setTimeout(() => {
            this.navigationService.navigateToHome();
          }, 2000);
        },
        error: (err) => {
          console.error(
            ' No se pudieron recuperar los detalles de la mesa:',
            err
          );
          this.sweetAlertService.close();
          this.navigationService.navigateToHome();
        },
      });
    } else {
      console.log('Sin sesión de mesa, navegando a food-venues');
      this.navigationService.navigateToFoodVenues();
    }
  }
}
