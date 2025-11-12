import { Component, inject, signal } from '@angular/core';
import { OrderService } from '../../../services/order-service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { LucideAngularModule, Package } from 'lucide-angular';
import { OrderCardComponent } from '../Order-card/order-card';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, OrderCardComponent],
  templateUrl: './my-orders.html',})
export class MyOrders {
  readonly Package = Package;
  private orderService = inject(OrderService);

  orders = this.orderService.myOrders;
  isLoading = this.orderService.isLoading;
  error = this.orderService.error;

  onOrderSelected(event: {orderId: string, isSelected: boolean}) {
    console.log(`Orden ${event.orderId} seleccionada: ${event.isSelected}`);
    //añadir los IDs a un array para acciones
  }
}
