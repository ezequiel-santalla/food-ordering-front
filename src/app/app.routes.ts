import { Routes } from '@angular/router';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard';
import { UnauthenticatedGuard } from './auth/guards/unauthenticated.guard';
import { HasTableSessionGuard } from './auth/guards/has-table-session.guard';
import { QrScannerComponent } from './auth/components/qr-scanner/qr-scanner';
import { EmploymentInvitationResponseComponent } from './admin-front/components/employment-invitation-response/employment-invitation-response';

export const routes: Routes = [
  // 🔄 Redirección inicial a food-venues
  {
    path: '',
    redirectTo: 'food-venues',
    pathMatch: 'full',
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
  {
    path: 'scan-camera',
    component: QrScannerComponent,
  },

  // 📱 Escaneo de QR (NO requiere estar autenticado)
  {
    path: 'scan-qr/:tableId',
    //canActivate: [ScanQrGuard],
    loadComponent: () =>
      import('./auth/pages/qr-scan-handler/qr-scan-handler').then(
        (m) => m.QrScanHandlerComponent
      ),
  },

  {
    path: 'profile', // <-- 2. Esta ruta coincide con tu routerLink
    canActivate: [AuthenticatedGuard], // <-- 3. Protegida por autenticación
    loadComponent: () =>
      // 4. Apunta al archivo del componente de la página
      import('./store-front/pages/profile-page/profile-page').then(
        (m) => m.ProfilePage
      ),
  },

  // 🏠 Store Front - Menú, Pedidos, etc. (requiere autenticación + tableSessionId)
  {
    path: 'session/:tableSessionId',
    canActivate: [HasTableSessionGuard],
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
    canActivate: [AuthenticatedGuard],
    loadChildren: () => import('./admin-front/admin-front.routes'),
  },

  {
    path: 'invitations/respond',
    component: EmploymentInvitationResponseComponent,
  },

  // 🔄 Cualquier ruta no encontrada redirige a food-venues
  {
    path: '**',
    redirectTo: 'food-venues',
  },
];
