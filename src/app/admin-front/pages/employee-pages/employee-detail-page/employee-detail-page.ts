import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { EmployeeService } from '../../../services/employee-service';
import { EmployeeRequest, EmploymentContent, RoleType } from '../../../models/response/employee';
import { FormsModule } from '@angular/forms';

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
      // Por ahora asumimos que todos están activos al cargar
      // Podrías agregar un campo 'active' al modelo si el backend lo devuelve
      this.isActive = this.employee.active;
      this.originalStatus = true;
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
      role: this.selectedRole
    };

    this.employeeService.updateEmployee(this.employee.publicId, updateData).subscribe({
      next: () => {
        alert('Empleado actualizado exitosamente');
        this.employeeUpdated.emit();
      },
      error: (e) => {
        console.error(e);
        alert('Error al actualizar el empleado');
      }
    });
  }

  deactivateEmployee(): void {
    if (!this.employee) {
      return;
    }

    if (confirm('¿Estás seguro de que deseas dar de baja a este empleado?')) {
      this.employeeService.deleteEmployee(this.employee.publicId).subscribe({
        next: () => {
          alert('Empleado dado de baja exitosamente');
          this.employeeUpdated.emit();
        },
        error: (e) => {
          console.error(e);
          alert('Error al dar de baja el empleado');
        }
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
