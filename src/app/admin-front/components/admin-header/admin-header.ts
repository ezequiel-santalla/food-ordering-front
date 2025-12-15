import { Component } from '@angular/core';
import { AuthService } from '../../../auth/services/auth-service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-header.html'
})
export class AdminHeader {
constructor (private authService : AuthService,
            private router : Router
){}

 logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);

        this.router.navigate(['/']);
      },
    });
  }

}
