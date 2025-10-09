import { Routes } from "@angular/router";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { AuthLayoutComponent } from "./layout/auth-layout/auth-layout.component";

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      // Login
      {
        path: 'login',
        component: LoginPageComponent,
      },
      
      // Redirección por defecto dentro de /auth
      {
        path: '**',
        redirectTo: 'login',
      }
    ]
  }
];

export default authRoutes;
