import { Component, computed, inject, effect, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Employment } from '../../../shared/models/common';
import { Briefcase, LucideAngularModule, User } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../shared/services/navigation.service';

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

  public User = User;
  public Briefcase = Briefcase;

  public employments: Signal<Employment[]> = this.authService.employments;
  public hasEmployments = computed(() => this.employments().length > 0);
  public authStatus = this.authService.authStatus; // Mapeo para mostrar nombres más amigables

  public roleDisplayNames: { [key: string]: string } = {
    ROLE_ROOT: 'Superusuario',
    ROLE_ADMIN: 'Administrador',
    ROLE_MANAGER: 'Encargado',
    ROLE_STAFF: 'Empleado',
  };

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
        this.router.navigate(['/dashboard/admin']); // Cambia esta ruta a tu dashboard de admin/staff
      },
      error: (err) => {
        console.error('Error al seleccionar el rol', err);
      },
    });
  }
  /**
   * Continúa la navegación con el rol de cliente por defecto.
   */

  continueAsClient(): void {
    console.log('Continuando como cliente...');
    // El token ya es de cliente, solo necesitamos navegar
    // según el estado actual de la sesión (si tiene sesión de mesa o no).
    this.navigationService.navigateBySessionState();
  }
}
