import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { EmployeeService } from '../../../services/employee-service';
import { EmployeeRequest, EmploymentContent, RoleType } from '../../../models/response/employee';
import { FormsModule } from '@angular/forms';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-employee-detail-page',
  imports: [FormsModule],
  templateUrl: './employee-detail-page.html'
})
export class EmployeeDetailPage {
  @Input() isOpen = false;
  @Input() employee: EmploymentContent | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() employeeUpdated = new EventEmitter<void>();

  private employeeService = inject(EmployeeService);
  private sweetAlertService = inject(SweetAlertService);

  // Exponer RoleType para el template
  RoleType = RoleType;

  // Estados editables
  selectedRole: RoleType = RoleType.ROLE_STAFF;
  isActive: boolean = true;

  // Estados originales para detectar cambios
  private originalRole: RoleType = RoleType.ROLE_STAFF;
  private originalStatus: boolean = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (this.employee) {
      this.selectedRole = this.employee.role;
      this.originalRole = this.employee.role;
      this.isActive = this.employee.active;
      this.originalStatus = this.employee.active;
    }
  }

  getInitials(name: string, lastName: string): string {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  hasChanges(): boolean {
    return this.selectedRole !== this.originalRole || this.isActive !== this.originalStatus;
  }

  updateEmployee(): void {
    if (!this.employee || !this.hasChanges()) {
      return;
    }

    console.log("ID del Empleado para actualizar:", this.employee.publicId);

    const updateData: EmployeeRequest = {
      userEmail: this.employee.user.email,
      role: this.selectedRole,
      active: this.isActive
    };

    this.employeeService.updateEmployee(this.employee.publicId, updateData).subscribe({
      next: () => {
        this.sweetAlertService.showSuccess(
          'Empleado actualizado',
          'Los datos del empleado se actualizaron correctamente.'
        );
        this.employeeUpdated.emit();
        this.onClose();
      },
      error: (e) => {
        console.error(e);
        this.sweetAlertService.showError(
          'Error al actualizar',
          `No se pudo actualizar el empleado con email: ${updateData.userEmail}`
        );
      }
    });
  }

  async deactivateEmployee(): Promise<void> {
    if (!this.employee) {
      return;
    }

    const employeeName = `${this.employee.user.name} ${this.employee.user.lastName}`;

    const confirmed = await this.sweetAlertService.confirmCustomAction(
      '¿Dar de baja empleado?',
      `El empleado ${employeeName} será dado de baja. Esta acción no se puede deshacer.`,
      'Sí, dar de baja',
      'Cancelar',
      'warning'
    );

    if (confirmed) {
      this.employeeService.deleteEmployee(this.employee.publicId).subscribe({
        next: () => {
          this.sweetAlertService.showSuccess(
            'Empleado dado de baja',
            'El empleado ha sido dado de baja exitosamente.'
          );
          this.employeeUpdated.emit();
          this.onClose();
        },
        error: (e) => {
          console.error(e);
          this.sweetAlertService.showError(
            'Error al dar de baja',
            'No se pudo dar de baja al empleado. Por favor, intenta nuevamente.'
          );
        }
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
