import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Servicio para generar rutas de sesión dinámicamente
 * Evita inyectar AuthService en cada componente solo para obtener rutas
 */
@Injectable({ providedIn: 'root' })
export class SessionRoutesService {

  private authService = inject(AuthService);

  // Computed signals para rutas comunes
  homeRoute = computed(() => ['/session', this.authService.tableSessionId()]);

  notificationsRoute = computed(() => ['/session', this.authService.tableSessionId(), 'notifications']);

  profileRoute = computed(() => ['/session', this.authService.tableSessionId(), 'profile']);

  menuRoute = computed(() => ['/session', this.authService.tableSessionId(), 'menu']);

  ordersRoute = computed(() => ['/session', this.authService.tableSessionId(), 'orders']);

  paymentsRoute = computed(() => ['/session', this.authService.tableSessionId(), 'payments']);

  /**
   * Genera una ruta personalizada dentro de session
   * @param path - Ruta relativa, ej: 'menu/item/123'
   */
  getRoute(path: string): string[] {
    const sessionId = this.authService.tableSessionId() ?? '';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return ['/session', sessionId, ...cleanPath.split('/')];
  }

  /**
   * Genera ruta a un item de menú específico
   */
  menuItemRoute(itemName: string): string[] {
    return this.getRoute(`menu/${itemName}`);
  }

  /**
   * Genera ruta a una orden específica
   */
  orderRoute(orderId: string): string[] {
    return this.getRoute(`orders/${orderId}`);
  }
}
