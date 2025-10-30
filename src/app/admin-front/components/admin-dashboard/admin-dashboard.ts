import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard {

@Input() isCollapsed: boolean = true;
@Output() toggleRequest = new EventEmitter<void>();

constructor (private authService : AuthService,
            private router : Router){}


logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.router.navigate(['/food-venues']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);

        this.router.navigate(['/food-venues']);
      },
    });
  }

onToggle() {
    this.toggleRequest.emit();
  }

}
