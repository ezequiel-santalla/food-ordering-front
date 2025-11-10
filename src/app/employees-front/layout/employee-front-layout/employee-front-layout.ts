import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EmployeesDashboard } from "../../components/employees-dashboard/employees-dashboard";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-front-layout',
  imports: [RouterOutlet, EmployeesDashboard, CommonModule],
  templateUrl: './employee-front-layout.html',
  styleUrl: './employee-front-layout.css'
})
export class EmployeeFrontLayout {
  isSidebarCollapsed = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

}
