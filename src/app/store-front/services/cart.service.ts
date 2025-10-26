// services/cart.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/cart.interface';

@Injectable({ providedIn: 'root' })
export class CartService {

  private _items = signal<CartItem[]>(this.loadFromStorage());

  items = this._items.asReadonly();

  total = computed(() =>
    this._items().reduce((sum, item) =>
      sum + (item.productPrice * item.quantity), 0
    )
  );

  itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  addItem(
    productName: string,
    productPrice: number,
    specialInstructions: string | null,
    quantity: number,
    productImage?: string
  ): void {
    const currentItems = this._items();

    // Buscar si ya existe el producto con las mismas instrucciones
    const existingIndex = currentItems.findIndex(
      item => item.productName === productName &&
              item.specialInstructions === specialInstructions
    );

    if (existingIndex >= 0) {
      // Si existe, SUMAR la nueva cantidad
      const updated = [...currentItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity
      };
      this._items.set(updated);
    } else {
      // Si no existe, agregar nuevo con la cantidad recibida
      this._items.update(items => [...items, {
        productName,
        productPrice,
        productImage,
        quantity: quantity,
        specialInstructions
      }]);
    }

    this.saveToStorage();
    console.log('✅ Producto agregado a la orden');
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }

    this._items.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });

    this.saveToStorage();
  }

  updateInstructions(index: number, instructions: string): void {
    this._items.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], specialInstructions: instructions };
      return updated;
    });

    this.saveToStorage();
  }

  removeItem(index: number): void {
    this._items.update(items => items.filter((_, i) => i !== index));
    this.saveToStorage();
    console.log('🗑️ Producto eliminado de la orden');
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem('cart');
    console.log('🧹 Orden limpiada');
  }

  // ========== PERSISTENCIA ==========

  private saveToStorage(): void {
    try {
      localStorage.setItem('cart', JSON.stringify(this._items()));
    } catch (error) {
      console.error('Error guardando orden:', error);
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error cargando orden:', error);
      return [];
    }
  }
}
