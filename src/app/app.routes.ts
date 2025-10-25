import { Routes } from '@angular/router';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard';
import { UnauthenticatedGuard } from './auth/guards/unauthenticated.guard';
import { HasTableSessionGuard } from './auth/guards/has-table-session.guard';
import { ScanQrGuard } from './auth/guards/scan-qr-guard.guard';

export const routes: Routes = [
  // 🔄 Redirección inicial a food-venues
  {
    path: '',
    redirectTo: 'admin/products/edit/e014eefa-e8e9-434a-965c-f5e935f40480',
    pathMatch: 'full'
  },

  // 🔐 Rutas de autenticación (solo para usuarios NO autenticados)
  {
    path: 'auth',
    canActivate: [UnauthenticatedGuard],
    loadChildren: () => import('./auth/auth.routes'),
  },
  {
    path: 'role-selection', // La URL será tudominio.com/role-selection
    //canActivate: [AuthenticatedGuard], // Protegida por el guard de autenticados
    loadComponent: () =>
      import('./auth/pages/role-selection/role-selection').then(
        (m) => m.RoleSelectionComponent
      ),
  },

  // 📱 Escaneo de QR (NO requiere estar autenticado)
  {
    path: 'scan-qr/:tableId',
    canActivate: [ScanQrGuard],
    loadComponent: () =>
      import('./auth/pages/scan-qr-page/scan-qr-page.component').then(
        (m) => m.ScanQrPageComponent
      ),
  },

  // 🏠 Store Front - Menú, carrito, etc. (requiere autenticación + tableSessionId)
  {
    path: 'session/:tableSessionId',
    canActivate: [AuthenticatedGuard, HasTableSessionGuard],
    loadChildren: () => import('./store-front/store-front.routes'),
  },

  // 🍽️ Restaurantes (público)
  {
    path: 'food-venues',
    loadChildren: () => import('./food-venues/food-venues.routes'),
  },

  // ADMIN DASHBOARD
  {
    path: 'admin',
    loadChildren: () => import('./admin-front/admin-front.routes')
  },



  // 🔄 Cualquier ruta no encontrada redirige a food-venues
  {
    path: '**',
    redirectTo: 'food-venues'
  }
];
