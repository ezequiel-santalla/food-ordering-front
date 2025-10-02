import { Routes } from '@angular/router';
import { StoreFrontLayoutComponent } from './layouts/store-front-layout/store-front-layout';
import { NotificationsPage } from './pages/notifications-page/notifications-page';
import { ProfilePage } from './pages/profile-page/profile-page';
import { HomePage } from './pages/home-page/home-page';
import { NotFoundPage } from './pages/not-found-page/not-found-page';

export const storeFrontRoutes: Routes = [
  {
    path: '',
    component: StoreFrontLayoutComponent,
    children: [
      {
        path: '',
        component: HomePage,
      },
      {
        path: 'notifications',
        component: NotificationsPage,
      },
      {
        path: 'profile',
        component: ProfilePage,
      },
      {
        path: 'menu',
        loadChildren: () => import('./routes/menu.routes').then(m => m.Menu),
      },
      {
        path: 'orders',
        loadChildren: () => import('./routes/orders.routes').then(m => m.Orders),
      },
      {
        path: 'payments',
        loadChildren: () => import('./routes/payments.routes').then(m => m.Payments),
      },
      {
        path: '**',
        component: NotFoundPage,
      }
    ],
  },
  {
    path: '**',
    redirectTo: '',
  }
];

export default storeFrontRoutes;
