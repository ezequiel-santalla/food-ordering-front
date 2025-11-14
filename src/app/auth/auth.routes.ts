import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { ResendEmailPageComponent } from './pages/resend-email-page/resend-email-page.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email';

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
        path: 'register',
        component: RegisterPageComponent,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordPageComponent,
      },
      {
        path: 'reset-password',
        component: ResetPasswordPageComponent,
      },
      {
        path: 'resend-verification',
        component: ResendEmailPageComponent,
      },
      {
        path: 'verify-email',
        component: VerifyEmailComponent,
      },
      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];

export default authRoutes;
