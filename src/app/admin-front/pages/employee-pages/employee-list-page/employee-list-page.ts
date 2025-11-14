import { Component, effect, ElementRef, HostListener, inject } from '@angular/core';
import {  EmployeeResponse, EmploymentContent, RoleLabels, RoleType } from '../../../models/response/employee';
import { EmployeeService } from '../../../services/employee-service';
import { PaginationService } from '../../../../shared/components/pagination/pagination.service';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { EmployeeDetailPage } from '../employee-detail-page/employee-detail-page';
import { EmployeeFormPage } from '../employee-form-page/employee-form-page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-employee-list-page',
  imports: [CommonModule, PaginationComponent, EmployeeDetailPage, EmployeeFormPage, FormsModule],
  templateUrl: './employee-list-page.html'
})
export class EmployeeListPage {
  openMenuIndex: number | null = null;
  totalPages = 1;
  showAssignModal = false;
  showDetailModal = false;
  searchEmail = '';
  activeFilter: boolean | null = null;
  selectedEmployee: EmploymentContent | null = null;

  public employeeService = inject(EmployeeService);
  private paginationService = inject(PaginationService);
  private eRef = inject(ElementRef);
  private sweetAlertService = inject(SweetAlertService);

  currentPage = this.paginationService.currentPage;

  constructor() {
    effect(() => {
      const page = this.paginationService.currentPage();
      this.getEmployees(page);
    });
  }

  ngOnInit(): void {
    this.getEmployees();
  }

  getEmployees(page: number = 1): void {
    this.employeeService.getEmployees(
      page - 1,
      this.searchEmail || undefined,
      this.activeFilter ?? undefined
    ).subscribe({
      next: (data: EmployeeResponse) => {
        this.employeeService.contents = data.content;
        this.totalPages = data.totalPages;
      },
      error: (e) => {
        console.error(e);
        this.sweetAlertService.showError(
          'Error al cargar empleados',
          'No se pudieron cargar los empleados. Por favor, intenta nuevamente.'
        );
      }
    });
  }

  searchEmployees(): void {
    this.getEmployees(1);
  }

  filterByStatus(status: boolean | null): void {
    this.activeFilter = status;
    this.getEmployees(1);
  }

  getInitials(name: string, lastName: string): string {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getRoleLabel(role: RoleType): string {
    return RoleLabels[role] || role;
  }

  getRoleBadgeClass(role: RoleType): string {
    const baseClass = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full';

    switch (role) {
      case RoleType.ROLE_MANAGER:
        return `${baseClass} bg-indigo-100 text-indigo-800`;
      case RoleType.ROLE_STAFF:
        return `${baseClass} bg-gray-100 text-gray-800`;
      default:
        return `${baseClass} bg-blue-100 text-blue-800`;
    }
  }

  openAssignModal(): void {
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
  }

  onEmployeeAssigned(): void {
    this.closeAssignModal();
    this.getEmployees(this.currentPage());
  }

  openEmployeeDetailModal(employee: EmploymentContent): void {
    this.selectedEmployee = employee;
    this.showDetailModal = true;
    this.openMenuIndex = null;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedEmployee = null;
  }

  onEmployeeUpdated(): void {
    this.closeDetailModal();
    this.getEmployees(this.currentPage());
  }

  toggleMenu(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.eRef.nativeElement.contains(target);

    const isMenuButton = target.closest('button[aria-expanded]');
    const isDropdownMenu = target.closest('[id^="menu-"]');

    if (!clickedInside || (!isMenuButton && !isDropdownMenu)) {
      this.openMenuIndex = null;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    this.openMenuIndex = null;

    // Buscar el empleado para mostrar su nombre en la confirmación
    const employee = this.employeeService.contents.find(emp => emp.publicId === id);
    const employeeName = employee
      ? `${employee.user.name} ${employee.user.lastName}`
      : 'este empleado';

    const confirmed = await this.sweetAlertService.confirmDelete(
      employeeName,
      'empleado'
    );

    if (confirmed) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.sweetAlertService.showSuccess(
            'Empleado eliminado',
            'El empleado ha sido eliminado exitosamente.'
          );
          this.getEmployees(this.currentPage());
        },
        error: (e) => {
          console.error(e);
          this.sweetAlertService.showError(
            'Error al eliminar',
            'No se pudo eliminar al empleado. Por favor, intenta nuevamente.'
          );
        }
      });
    }
  }
}
