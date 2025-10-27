import { Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { OrderService } from '../../../services/order.service';
import { OrderResponse } from '../../../models/order.interface';
import { CurrencyPipe } from '@angular/common';
import { LucideAngularModule, Clock, CircleCheckBig, CircleX, Package } from 'lucide-angular';

@Component({
  selector: 'app-table-orders',
  imports: [CurrencyPipe, LucideAngularModule],
  templateUrl: './table-orders.html',
})
export class TableOrders implements OnInit {

  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;

  refresh = input<boolean>(false);

  private orderService = inject(OrderService);

  orders = signal<OrderResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  tableNumber = signal<string | null>(localStorage.getItem('tableNumber'));

  constructor() {
    effect(() => {
      if (this.refresh()) {
        console.log('🔍 TableOrders - Effect disparado, recargando...');
        this.loadOrders();
      }
    });
  }

  ngOnInit(): void {
    console.log('🔍 TableOrders - ngOnInit ejecutado');
    this.loadOrders();
  }

  loadOrders(): void {
    console.log('🔍 Iniciando carga de pedidos de TODA LA MESA...');
    this.isLoading.set(true);
    this.error.set(null);

    // ✅ Usa getCurrentSessionOrders para PEDIDOS DE LA MESA
    this.orderService.getCurrentSessionOrders().subscribe({
      next: (paginatedResponse) => {
        console.log('✅ TableOrders - Respuesta paginada recibida:', paginatedResponse);

        const orders = paginatedResponse.content;
        console.log('✅ TableOrders - Total de pedidos de la mesa:', orders.length);

        // Ordenar por número de orden descendente (más reciente primero)
        const sortedOrders = orders.sort((a, b) =>
          Number(b.orderNumber) - Number(a.orderNumber)
        );

        console.log('✅ TableOrders - Pedidos ordenados:', sortedOrders);
        this.orders.set(sortedOrders);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ TableOrders - Error completo:', err);
        this.error.set('No se pudieron cargar los pedidos de la mesa');
        this.isLoading.set(false);
      }
    });
  }

  getTotalTable(): number {
    return this.orders().reduce((total, order) => total + order.totalPrice, 0);
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
