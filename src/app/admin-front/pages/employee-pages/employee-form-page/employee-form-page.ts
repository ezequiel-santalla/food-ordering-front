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
