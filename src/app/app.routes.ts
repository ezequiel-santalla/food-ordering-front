import { Routes } from '@angular/router';
import { UnauthenticatedGuard } from './auth/guards/unauthenticated.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes),
    canMatch: [UnauthenticatedGuard]
  },
  {
    path: 'scan-qr',
    loadComponent: () => import('./auth/pages/scan-qr-page/scan-qr-page.component')
      .then(m => m.ScanQrPageComponent),
    canMatch: []
  },
  {
    path: '',
    loadChildren: () => import('./store-front/store-front.routes'),
    canMatch: []
  },
];
