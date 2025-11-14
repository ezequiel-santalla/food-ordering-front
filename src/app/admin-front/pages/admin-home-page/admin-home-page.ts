import { Component } from '@angular/core';
import AdminInfo from '../../models/user-info';
import { AuthService } from '../../../auth/services/auth-service';
import { SessionUtils } from '../../../utils/session-utils';
import { JwtUtils } from '../../../utils/jwt-utils';
import { FoodVenueService } from '../../services/food-venue-service';
import { Router } from '@angular/router';
interface Section {
  title: string;
  description: string;
  iconPath: string;
  rule: 'evenodd' | 'nonzero';
}

@Component({
  selector: 'app-admin-home-page',
  imports: [],
  templateUrl: './admin-home-page.html',
  styleUrl: './admin-home-page.css'
})
export class AdminHomePage {
adminInfo: AdminInfo = {
      email: 'Cargando...',
      role: 'Cargando...',
      foodVenueName: 'Cargando...'
    };

sections: Section[] = [
    {
      title: 'Armado de Salon',
      description: 'Diagrama tu salon como lo tenes fisicamente.',
      iconPath: 'M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z',
      rule: 'evenodd'
    },
    {
      title: 'Productos',
      description: 'Crea, edita y organiza tus platillos, precios, descripcion y foto.',
      iconPath: 'M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',
      rule: 'evenodd'
    },
    {
      title: 'Categorias',
      description: 'Crea tus categorias para poder clasificar tus productos de manera jerarquica.',
      iconPath: 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z',
      rule: 'evenodd'
    },
    {
      title: 'Etiquetas (Tags)',
      description: 'Define y asigna tags a platillos para filtrado rápido y promociones.',
      iconPath: 'M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.999.999 0 013 9V5a2 2 0 012-2h4a.999.999 0 01.707.293l7 7zM5 5h4v4H5V5z',
      rule: 'evenodd'
    },
    {
      title: 'Empleados',
      description: 'Visualiza y agrega los empleados que trabajan en tu Local.',
      iconPath: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
      rule: 'evenodd'
    },
    {
      title: 'Balances',
      description: 'Analiza ventas, rendimiento de platillos y tendencias de consumo.',
      iconPath: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',
      rule: 'evenodd'
    },

  ];

constructor (private authService : AuthService,
              private foodVenueService: FoodVenueService,
              private router : Router
){}
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
                  this.adminInfo.email = decodedToken.sub || 'Email no disponible';

                  // Formatear el rol: de 'ROLE_ADMIN' a 'Administrador'
                  let userRole = decodedToken.role || 'Usuario';
                  userRole = userRole.replace('ROLE_', '').toLowerCase(); // 'admin'
                  // Poner la primera letra en mayúscula
                  this.adminInfo.role = userRole.charAt(0).toUpperCase() + userRole.slice(1);
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
                    this.adminInfo.foodVenueName = foodVenue.name;
                } else {
                    this.adminInfo.foodVenueName = 'Local sin nombre definido';
                }
            },
            // 'error' es el callback cuando la llamada falla
            error: (err) => {
                console.error('❌ Error cargando nombre del local:', err);
                this.adminInfo.foodVenueName = 'Error al cargar local';
            },
            // 'complete' se ejecuta cuando el Observable termina, puedes dejarlo vacío si no es necesario
            // complete: () => {
            //     console.log('Carga del nombre del local completada.');
            // }
        });
    }
}
