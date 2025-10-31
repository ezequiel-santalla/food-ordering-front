import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { EmployeeRequest, RoleType } from '../../../models/response/employee';
import { EmployeeService } from '../../../services/employee-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-form-page',
  imports: [FormsModule],
  templateUrl: './employee-form-page.html'
})
export class EmployeeFormPage {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() employeeAssigned = new EventEmitter<void>();

  private employeeService = inject(EmployeeService);

  // Exponer RoleType para el template
  RoleType = RoleType;

  employeeData: EmployeeRequest = {
    userEmail: '',
    role: null as any
  };

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.employeeData.userEmail || !this.employeeData.role) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Primero verificamos si el email existe
    this.employeeService.existsByEmail(this.employeeData.userEmail).subscribe({
      next: (exists: boolean) => {
        if (!exists) {
          alert('Email ingresado incorrecto');
          return;
        }

        // Si el email existe, procedemos a crear el empleado
        this.employeeService.createEmployee(this.employeeData).subscribe({
          next: () => {
            alert('Solicitud de empleo enviada correctamente');
            this.employeeAssigned.emit();
            this.resetForm();
          },
          error: (e) => {
            console.error(e);
            // 💡 AQUÍ ES DONDE CAPTURAS Y MANEJAS EL ERROR 409 💡
            if (e.status === 409 && e.error && e.error.appCode) {
              const appCode = e.error.appCode;

              switch (appCode) {
                case 'DUPLICATED_EMPLOYMENT':
                  alert('❌ Error: El Employment ya está asignado y se encuentra ACTIVO. No se puede crear uno duplicado.');
                  break;

                case 'INACTIVE_EMPLOYMENT':
                  alert('⚠️ Advertencia: Ya existe un Employment con este Rol, pero está INACTIVO. Debe activarlo en lugar de intentar crear uno nuevo.');
                  break;

                default:
                  alert('Error de conflicto (409) no especificado. Contacte a soporte.');
              }

            } else {
              alert('Error inesperado al asignar el empleado. Intente nuevamente.');
            }
            alert('Error al asignar el empleado');
          }
        });
      },
      error: (e) => {
        console.error(e);
        alert('Error al verificar el email');
      }
    });
  }

  private resetForm(): void {
    this.employeeData = {
      userEmail: '',
      role: null as any
    };
  }
}
