import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import EmployeeInfo from '../../models/user';
import { SessionUtils } from '../../../utils/session-utils';
import { JwtUtils } from '../../../utils/jwt-utils';
import { FoodVenueService } from '../../../admin-front/services/food-venue-service';

@Component({
  selector: 'app-employees-dashboard',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './employees-dashboard.html',
})
export class EmployeesDashboard {

@Input() isCollapsed: boolean = true;
@Output() toggleRequest = new EventEmitter<void>();

employeeInfo: EmployeeInfo= {
      email: 'Cargando...',
      role: 'Cargando...',
      foodVenueName: 'Cargando...'
    };


    constructor (private authService : AuthService,
                private foodVenueService: FoodVenueService,
                 private router : Router){}


    ngOnInit(): void {
        this.loadUserInfo();
        this.loadFoodVenueName();
    }


    loadUserInfo(): void {
        // 1. Obtener el accessToken del localStorage usando SessionUtils
        const accessToken = SessionUtils.getCleanStorageValue('accessToken');

        if (accessToken) {
            // 2. Decodificar el token para obtener los claims (payload)
            const decodedToken = JwtUtils.decodeJWT(accessToken);

            if (decodedToken) {
                // 3. Asignar los valores (usando 'sub' para email y 'role' para rol)
                this.employeeInfo.email = decodedToken.sub || 'Email no disponible';

                // Formatear el rol: de 'ROLE_ADMIN' a 'Administrador'
                let userRole = decodedToken.role || 'Usuario';
                userRole = userRole.replace('ROLE_', '').toLowerCase(); // 'admin'
                // Poner la primera letra en mayúscula
                this.employeeInfo.role = userRole.charAt(0).toUpperCase() + userRole.slice(1);
            } else {
                console.error('❌ Token decodificado inválido en AdminDashboard');
            }
        } else {
            console.warn('⚠️ No se encontró accessToken en localStorage para AdminDashboard');
        }
    }
loadFoodVenueName(): void {
        this.foodVenueService.getMyFoodVenue().subscribe({
            // 'next' es el callback cuando la llamada es exitosa
            next: (foodVenue) => {
                if (foodVenue && foodVenue.name) {
                    this.employeeInfo.foodVenueName = foodVenue.name;
                } else {
                    this.employeeInfo.foodVenueName = 'Local sin nombre definido';
                }
            },
            // 'error' es el callback cuando la llamada falla
            error: (err) => {
                console.error('❌ Error cargando nombre del local:', err);
                this.employeeInfo.foodVenueName = 'Error al cargar local';
            },
            // 'complete' se ejecuta cuando el Observable termina, puedes dejarlo vacío si no es necesario
            // complete: () => {
            //     console.log('Carga del nombre del local completada.');
            // }
        });
    }

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
