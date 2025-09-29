import { Routes } from '@angular/router';
import { StoreFrontLayoutComponent } from './layouts/store-front-layout/store-front-layout';
import { NotificationsPage } from './pages/notifications-page/notifications-page';
import { ProfilePage } from './pages/profile-page/profile-page';
import { HomePage } from './pages/home-page/home-page';
import { MenuPage } from './pages/menu-page/menu-page';
import { OrdersPage } from './pages/orders-page/orders-page';
import { PaymentPage } from './pages/payment-page/payment-page';
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
        component: MenuPage,
      },
      {
        path: 'orders',
        component: OrdersPage,
      },
      {
        path: 'payment',
        component: PaymentPage,
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
