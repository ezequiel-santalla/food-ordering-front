import { Routes } from "@angular/router";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { ScanQrPageComponent } from "./pages/scan-qr-page/scan-qr-page.component";
import { AuthLayoutComponent } from "./layout/auth-layout/auth-layout.component";

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        component: LoginPageComponent,
      },
      {
        path: 'scan-qr',
        component: ScanQrPageComponent,
      },
      {
        path: '**',
        redirectTo: 'login',
      }
    ]
  }
];
