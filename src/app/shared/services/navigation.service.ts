import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { SessionUtils } from '../../utils/session-utils';

@Injectable({ providedIn: 'root' })
export class NavigationService {

  private router = inject(Router);
  private authService = inject(AuthService);

  /**
   * Navega según el estado de la sesión
   * Si tiene tableSessionId válido -> home (/session/:tableSessionId)
   * Si no tiene -> scan-qr
   */
  navigateBySessionState(delay: number = 50): void {
    setTimeout(() => {
      const tableSessionId = this.authService.tableSessionId();

      console.log('🔍 Estado de navegación:', {
        tableSessionId,
        foodVenueId: this.authService.foodVenueId()
      });

      if (SessionUtils.isValidSession(tableSessionId)) {
        console.log('✅ Tiene sesión de mesa, navegando a home');
        this.navigateToHome();
      } else {
        console.log('⚠️ Sin sesión de mesa, navegando a scan-qr');
        this.navigateToScanQr();
      }
    }, delay);
  }

  /**
   * Navega al home si hay sesión válida
   * @returns true si navegó, false si no hay sesión válida
   */
  navigateToHomeIfHasSession(): boolean {
    const tableSessionId = this.authService.tableSessionId();

    if (SessionUtils.isValidSession(tableSessionId)) {
      console.log('✅ Sesión activa detectada, redirigiendo a home');
      this.navigateToHome();
      return true;
    }

    return false;
  }

  /**
   * Navega al home (/session/:tableSessionId)
   */
  navigateToHome(): void {
    const tableSessionId = this.authService.tableSessionId();
    this.router.navigate(['/session', tableSessionId], { replaceUrl: true });
  }

  /**
   * Navega a una ruta dentro de session
   * Ejemplo: navigateToSessionRoute('menu/item/123')
   */
  navigateToSessionRoute(route: string): void {
    const tableSessionId = this.authService.tableSessionId();
    const cleanRoute = route.startsWith('/') ? route.substring(1) : route;
    this.router.navigate(['/session', tableSessionId, ...cleanRoute.split('/')]);
  }

  /**
   * Navega a scan-qr
   */
  navigateToScanQr(): void {
    this.router.navigate(['/scan-qr'], { replaceUrl: true });
  }

  /**
   * Navega al login
   */
  navigateToLogin(): void {
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
