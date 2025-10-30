import { Component } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';
import { AdminHeader } from "../../components/admin-header/admin-header";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-front-layout',
  imports: [RouterOutlet, AdminDashboard, CommonModule],
  templateUrl: './admin-front-layout.html'
})
export class AdminFrontLayout {
  isSidebarCollapsed = true;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
