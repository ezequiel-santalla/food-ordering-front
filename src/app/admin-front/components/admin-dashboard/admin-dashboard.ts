import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard {
@Input() isCollapsed: boolean = true;
}
