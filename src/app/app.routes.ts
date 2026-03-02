import { Routes } from '@angular/router';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard';
import { UnauthenticatedGuard } from './auth/guards/unauthenticated.guard';
import { HasTableSessionGuard } from './auth/guards/has-table-session.guard';
import { QrScannerComponent } from './auth/components/qr-scanner/qr-scanner';
import { EmploymentInvitationResponseComponent } from './admin-front/components/employment-invitation-response/employment-invitation-response';
import { HomeComponent } from './store-front/components/home/home-component';
import { RootGuard } from './root-front/guards/root.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Dinno - Escaneá, Pedí, Disfrutá',
  },

  // 🔐 Rutas de autenticación (solo para usuarios NO autenticados)
  {
    path: 'auth',
    canActivate: [UnauthenticatedGuard],
    loadChildren: () => import('./auth/auth.routes'),
  },
  {
    path: 'role-selection',
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
    loadComponent: () =>
      import('./auth/pages/qr-scan-handler/qr-scan-handler').then(
        (m) => m.QrScanHandlerComponent
      ),
  },

  {
    path: 'profile',
    canActivate: [AuthenticatedGuard],
    loadComponent: () =>
      import('./store-front/pages/profile-page/profile-page').then(
        (m) => m.ProfilePage
      ),
  },

  // 🏠 Store Front - Sesión Activa (Menú, Pedidos)
  // Esta ruta se activa cuando el usuario está EN una mesa
  {
    path: 'session/:tableSessionId',
    canActivate: [HasTableSessionGuard],
    loadChildren: () => import('./store-front/store-front.routes'),
  },

  // 🍽️ Restaurantes (público)
  {
    path: 'food-venues',
    loadChildren: () => import('./food-venues/food-venues.routes'),
    title: 'Restaurantes Disponibles',
  },
  
  {
    path: 'root-admin',
    canActivate: [RootGuard],
    loadChildren: () => import('./root-front/root.routes').then(m => m.ROOT_ROUTES)
  },

  // ADMIN LAYOUT
  {
    path: 'admin',
    canActivate: [AuthenticatedGuard],
    loadChildren: () => import('./admin-front/admin-front.routes'),
  },

  // EMPLOYEES LAYOUT
  {
    path: 'employee',
    canActivate: [AuthenticatedGuard],
    loadChildren: () => import('./employees-front/employees-front.routes')
  },

  {
    path: 'invitations/respond',
    component: EmploymentInvitationResponseComponent,
  },

  {
    path: '**',
    redirectTo: '',
  },
];