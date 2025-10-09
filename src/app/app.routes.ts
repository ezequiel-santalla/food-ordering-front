import { Routes } from '@angular/router';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard';
import { UnauthenticatedGuard } from './auth/guards/unauthenticated.guard';
import { HasTableSessionGuard } from './auth/guards/has-table-session.guard';

export const routes: Routes = [
  // 🔐 Rutas de autenticación (solo para usuarios NO autenticados)
  {
    path: 'auth',
    canActivate: [UnauthenticatedGuard],
    loadChildren: () => import('./auth/auth.routes')
  },

  // 📱 Escaneo de QR (requiere estar autenticado, pero NO necesita tableSessionId)
  {
    path: 'scan-qr',
    canActivate: [AuthenticatedGuard],
    loadComponent: () =>
      import('./auth/pages/scan-qr-page/scan-qr-page.component')
        .then(m => m.ScanQrPageComponent)
  },

  // 🏠 Store Front - Menú, carrito, etc. (requiere autenticación + tableSessionId)
  {
    path: '',
    canActivate: [AuthenticatedGuard, HasTableSessionGuard],
    loadChildren: () => import('./store-front/store-front.routes')
  },

  // 🔄 Cualquier ruta no encontrada redirige a la raíz
  {
    path: '**',
    redirectTo: ''
  }
];
