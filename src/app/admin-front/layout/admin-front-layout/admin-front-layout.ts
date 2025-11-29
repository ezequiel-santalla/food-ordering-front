import { Component, HostListener } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';
import { AdminHeader } from "../../components/admin-header/admin-header";
import { CommonModule } from '@angular/common';
import { AdminMobileNav } from "../../components/admin-mobile-nav/admin-mobile-nav";

@Component({
  selector: 'app-admin-front-layout',
  imports: [RouterOutlet, AdminDashboard, CommonModule, AdminMobileNav],
  templateUrl: './admin-front-layout.html'
})
export class AdminFrontLayout {
  isSidebarCollapsed = false;
  isMobile = false;

   constructor() {
    this.checkScreenSize();
  }
    @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
