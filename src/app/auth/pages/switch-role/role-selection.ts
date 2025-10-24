import { Component, computed, inject, effect, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
        this.router.navigate(['/auth/login']);
      }
    });
  }

  /**
   * Llama al servicio para seleccionar un rol específico y cambiar el contexto del token.
   * @param employment El empleo (rol) seleccionado.
   */
  selectEmployment(employment: Employment): void {
    this.authService.selectRole(employment.publicId).subscribe({
      next: () => {
        console.log(`Rol de ${employment.role} seleccionado. Redirigiendo...`);
        this.router.navigate(['admin']); // Cambia esta ruta a tu dashboard de admin/staff
      },
      error: (err) => {
        console.error('Error al seleccionar el rol', err);
      },
    });
  }

  /**
   * Continúa la navegación con el rol de cliente por defecto.
   * Si ya tiene sesión, va al home
   */
  continueAsClient(): void {
    console.log('Continuando como cliente...');

    const tableSessionId = this.authService.tableSessionId();

    // Verificar si ya tiene una sesión de mesa válida
    if (SessionUtils.isValidSession(tableSessionId)) {
      console.log('✅ Ya tiene sesión de mesa, navegando a home');
      this.navigationService.navigateToHome();
    } else {
      console.log('⚠️ Sin sesión de mesa, navegando a scan-camera');
      this.navigationService.navigateToScanCamera();
    }
  }
}
