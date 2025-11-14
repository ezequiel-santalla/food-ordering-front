import { Component, inject, signal } from '@angular/core';
import { CartService } from '../../../services/cart-service';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order-service';
import { OrderRequest } from '../../../models/order.interface';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { LucideAngularModule, ShoppingBasket, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-cart-view',
  imports: [CurrencyPipe, FormsModule, LucideAngularModule],
  templateUrl: './cart-view.html',
})
export class CartView {

  readonly ShoppingBasket = ShoppingBasket;
  readonly Trash2 = Trash2;

  cartService = inject(CartService);
  orderService = inject(OrderService);
  sweetAlert = inject(SweetAlertService);

  generalInstructions = '';
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  async removeItem(index: number, productName: string) {
    const confirmed = await this.sweetAlert.confirmCustomAction(
      '¿Eliminar producto?',
      `Se eliminará "${productName}" de tu orden`,
      'Sí, eliminar',
      'Cancelar',
      'warning'
    );

    if (confirmed) {
      this.cartService.removeItem(index);
      this.sweetAlert.showSuccess('Producto eliminado', '', 1500);
    }
  }

  async confirmOrder() {
    if (this.cartService.items().length === 0) {
      this.sweetAlert.showError('Orden vacía', 'Agrega productos antes de confirmar el pedido');
      return;
    }

    const confirmed = await this.sweetAlert.confirmCustomAction(
      '¿Confirmar pedido?',
      `Total: $${this.cartService.total().toFixed(2)} - Se enviará tu pedido a la cocina`,
      'Sí, confirmar',
      'Cancelar',
      'question'
    );

    if (!confirmed) return;

    this.isSubmitting.set(true);
    this.error.set(null);
    this.sweetAlert.showLoading('Procesando pedido...', 'Enviando tu orden');

    const orderRequest: OrderRequest = {
      orderDetails: this.cartService.items().map(item => ({
        productName: item.productName,
        specialInstructions: item.specialInstructions || '',
        quantity: item.quantity
      })),
      specialRequirements: this.generalInstructions.trim() || undefined
    };

    this.orderService.createOrder(orderRequest).subscribe({
      next: (response) => {
        console.log('✅ Pedido creado exitosamente:', response);
        this.sweetAlert.close();
        this.isSubmitting.set(false);

        this.sweetAlert.showSuccess(
          '¡Pedido confirmado!',
          `Número de orden: ${response.orderNumber}`,
          3000
        );

        this.cartService.clear();
        this.generalInstructions = '';
      },
      error: (err) => {
        console.error('❌ Error al crear pedido:', err);
        this.sweetAlert.close();
        this.isSubmitting.set(false);

        const errorMessage = err.error?.message ||
          'No se pudo procesar el pedido. Por favor, intenta nuevamente.';

        this.sweetAlert.showError('Error al confirmar', errorMessage);
        this.error.set(errorMessage);
      }
    });
  }
}
