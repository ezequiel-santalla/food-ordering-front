import { Routes } from '@angular/router';

export const ROOT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/root-dashboard').then(m => m.RootDashboardComponent),
    children: [
      {
        path: 'venues',
        loadComponent: () => import('./components/venue-list/venue-list').then(m => m.VenueListComponent)
      },
      {
        path: 'register-venue',
        loadComponent: () => import('./components/venue-registration/venue-registration').then(m => m.RootVenueRegistrationComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/user-list/user-list').then(m => m.UserListComponent)
      },
      {
        path: '',
        redirectTo: 'venues',
        pathMatch: 'full'
      }
    ]
  }
];