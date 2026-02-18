// services/cart.service.ts
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CartItem } from '../models/cart.interface';
import { Product } from '../models/menu.interface';
import { AuthStateManager } from '../../auth/services/auth-state-manager-service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private authState = inject(AuthStateManager);

  private _items = signal<CartItem[]>(this.loadFromStorage());

  items = this._items.asReadonly();

  total = computed(() =>
    this._items().reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0
    )
  );

  itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  constructor() {
    effect(() => {
      const currentVenue = this.authState.foodVenueId();
    });
  }

  addItem(
    product: Product,
    quantity: number,
    specialInstructions: string | null
  ) {
    const instructions = product.customizable ? specialInstructions : null;

    this.addItemInternal(
      product.name,
      product.price,
      instructions,
      quantity,
      product.imageUrl
    );
  }

  private addItemInternal(
    productName: string,
    productPrice: number,
    specialInstructions: string | null,
    quantity: number,
    productImage?: string
  ): void {
    const currentItems = this._items();
    const existingIndex = currentItems.findIndex(
      (item) =>
        item.productName === productName &&
        item.specialInstructions === specialInstructions
    );

    if (existingIndex >= 0) {
      const updated = [...currentItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
      this._items.set(updated);
    } else {
      this._items.update((items) => [
        ...items,
        {
          productName,
          productPrice,
          productImage,
          quantity: quantity,
          specialInstructions,
        },
      ]);
    }
    this.saveToStorage();
    console.log('✅ Producto agregado a la orden');
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }

    this._items.update((items) => {
      const updated = [...items];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });

    this.saveToStorage();
  }

  updateInstructions(index: number, instructions: string): void {
    this._items.update((items) => {
      const updated = [...items];
      updated[index] = { ...updated[index], specialInstructions: instructions };
      return updated;
    });

    this.saveToStorage();
  }

  removeItem(index: number): void {
    this._items.update((items) => items.filter((_, i) => i !== index));
    this.saveToStorage();
    console.log('🗑️ Producto eliminado de la orden');
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem('cart');
    console.log('🧹 Orden limpiada');
  }

  private saveToStorage(): void {
    try {
      const currentVenueId = this.authState.foodVenueId();

      const payload = {
        venueId: currentVenueId,
        items: this._items(),
      };

      localStorage.setItem('cart', JSON.stringify(this._items()));
    } catch (error) {
      console.error('Error guardando orden:', error);
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem('cart');
      if (!raw) return [];

      const parsed = JSON.parse(raw);

      const currentVenueId = this.authState.foodVenueId();

      const storedItems = Array.isArray(parsed) ? parsed : parsed.items || [];
      const storedVenueId = Array.isArray(parsed) ? null : parsed.venueId;

      if (currentVenueId && storedVenueId && currentVenueId !== storedVenueId) {
        console.warn(
          `🛒 Carrito pertenece a otro Venue (${storedVenueId}). Limpiando...`
        );
        localStorage.removeItem('cart');
        return [];
      }

      return storedItems;
    } catch (error) {
      console.error('Error cargando orden:', error);
      return [];
    }
  }
}
