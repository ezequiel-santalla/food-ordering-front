import { Component, computed, inject, effect, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Employment } from '../../../shared/models/common';
import { Briefcase, LucideAngularModule, User } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './role-selection.html',
})
export class RoleSelectionComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  public User = User;
  public Briefcase = Briefcase;

  public employments: Signal<Employment[]> = this.authService.employments;
  public hasEmployments = computed(() => this.employments().length > 0);
  public authStatus = this.authService.authStatus;

  // Mapeo para mostrar nombres más amigables
  public roleDisplayNames: { [key: string]: string } = {
    ROLE_ROOT: 'Superusuario',
    ROLE_ADMIN: 'Administrador',
    ROLE_MANAGER: 'Encargado',
    ROLE_STAFF: 'Empleado',
  };

  constructor() {
console.log('Cargando selector de roles');

    // 👇 LÓGICA MOVIDA AQUÍ DENTRO 👇
    effect(() => {
      // Este código se ejecutará cuando el estado de autenticación sea estable
      // y cada vez que 'hasEmployments' cambie.
      const status = this.authStatus();
      
      // Nos aseguramos de no redirigir si el estado todavía se está verificando
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
        // Redirigir al dashboard correspondiente (ej. /admin, /dashboard, etc.)
        console.log(`Rol de ${employment.role} seleccionado. Redirigiendo...`);
        this.router.navigate(['/dashboard/admin']); // Cambia esta ruta a tu dashboard de admin/staff
      },
      error: (err) => {
        console.error('Error al seleccionar el rol', err);
        // Aquí podrías mostrar una notificación de error al usuario
      },
    });
  }

  /**
   * Continúa la navegación con el rol de cliente por defecto.
   */
  continueAsClient(): void {
    console.log('Continuando como cliente...');
    // Simplemente redirigimos, ya que el token inicial ya es de cliente.
    this.router.navigate(['/dashboard/client']); // Cambia esta ruta a tu dashboard principal de cliente
  }
}
