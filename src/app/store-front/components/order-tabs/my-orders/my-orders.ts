import { Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { OrderService } from '../../../services/order.service';
import { OrderResponse } from '../../../models/order.interface';
import { CurrencyPipe } from '@angular/common';
import { LucideAngularModule, Clock, CircleCheckBig, CircleX, Package } from 'lucide-angular';

@Component({
  selector: 'app-my-orders',
  imports: [CurrencyPipe, LucideAngularModule],
  templateUrl: './my-orders.html',
})
export class MyOrders implements OnInit {

  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;

  refresh = input<boolean>(false);

  private orderService = inject(OrderService);

  orders = signal<OrderResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.refresh()) {
        console.log('🔍 MyOrders - Effect disparado, recargando...');
        this.loadOrders();
      }
    });
  }

  ngOnInit(): void {
    console.log('🔍 MyOrders - ngOnInit ejecutado');
    this.loadOrders();
  }

  loadOrders(): void {
    console.log('🔍 Iniciando carga de MIS pedidos (solo participante actual)...');
    this.isLoading.set(true);
    this.error.set(null);

    // ✅ Usa getCurrentParticipantOrders para MIS PEDIDOS
    this.orderService.getCurrentParticipantOrders().subscribe({
      next: (paginatedResponse) => {
        console.log('✅ MyOrders - Respuesta paginada recibida:', paginatedResponse);

        const orders = paginatedResponse.content;
        console.log('✅ MyOrders - Total de MIS pedidos:', orders.length);

        // Ordenar por número de orden descendente (más reciente primero)
        const sortedOrders = orders.sort((a, b) =>
          Number(b.orderNumber) - Number(a.orderNumber)
        );

        console.log('✅ MyOrders - Pedidos ordenados:', sortedOrders);
        this.orders.set(sortedOrders);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ MyOrders - Error completo:', err);
        this.error.set('No se pudieron cargar tus pedidos');
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'PENDING':
        return this.Clock;
      case 'COMPLETED':
        return this.CircleCheckBig;
      case 'CANCELLED':
        return this.CircleX;
      default:
        return this.Package;
    }
  }
}
