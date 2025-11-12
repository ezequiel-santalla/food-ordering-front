import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuService } from '../../services/menu-service';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { MenuItemDetailModal } from '../menu-item-detail-modal/menu-item-detail-modal';
import { Product } from '../../models/menu.interface';

type Node = {
  category: string;
  subcategory?: Node[];
  products?: Product[];
};

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, MenuItemCard, MenuItemDetailModal],
  templateUrl: './menu.html',
})
export class Menu {
  private menuService = inject(MenuService);

  // Modal
  selectedProduct = signal<Product | undefined>(undefined);
  openProduct(p: Product) { this.selectedProduct.set(p); }
  closeModal() { this.selectedProduct.set(undefined); }

  // Carga del menú
  menuResource = rxResource({
    stream: () => this.menuService.getMenu(),
  });

  // === Utils ===
  private norm = (s?: string) => (s ?? '').trim();
  private walkProducts = (n?: Node): Product[] => {
    if (!n) return [];
    const here = Array.isArray(n.products) ? n.products : [];
    const subs = Array.isArray(n.subcategory) ? n.subcategory.flatMap(this.walkProducts) : [];
    return [...here, ...subs];
  };
  private unique = <T>(arr: T[]) => Array.from(new Set(arr));

  // Árbol base
  tree = computed<Node[]>(() => (this.menuResource.value()?.menu as any) ?? []);

  // Nivel 1: nombres de categorías top
  level1 = computed<string[]>(() => this.tree().map(n => this.norm(n.category)).filter(Boolean));

  // Selecciones
  selectedL1 = signal<'all' | string>('all');
  selectedL2 = signal<'all' | string>('all');

  selectL1(name: 'all' | string) {
    this.selectedL1.set(name);
    this.selectedL2.set('all'); // reset cascada
  }
  selectL2(name: 'all' | string) {
    this.selectedL2.set(name);
  }

  // Buscar nodo Top por nombre
  private findTop(name: string): Node | undefined {
    const target = this.norm(name);
    return this.tree().find(n => this.norm(n.category) === target);
  }

  // Nivel 2: subcategorías del Top seleccionado
  level2 = computed<string[]>(() => {
    const l1 = this.selectedL1();
    if (l1 === 'all') return [];

    const top = this.findTop(l1);
    if (!top) return [];

    // Preferimos subcategory[].category
    const subsByNode = (top.subcategory ?? []).map(s => this.norm(s.category)).filter(Boolean);
    if (subsByNode.length) return this.unique(subsByNode);

    // Fallback: si no hay subnodes, usamos los category de los products dentro del Top
    const products = this.walkProducts(top);
    const subsByProducts = products.map(p => this.norm(p.category)).filter(Boolean);
    return this.unique(subsByProducts);
  });

  // Productos filtrados (2 niveles)
  products = computed<Product[]>(() => {
    const l1 = this.selectedL1();
    const l2 = this.selectedL2();

    // Sin Top: todos
    if (l1 === 'all') {
      return this.tree().flatMap(n => this.walkProducts(n));
    }

    const top = this.findTop(l1);
    if (!top) return [];

    // Con Top pero Sub = Todas → todo lo de ese Top
    if (l2 === 'all') return this.walkProducts(top);

    // Con Top + Sub → si existen subnodos con ese nombre, juntamos sus productos
    const subName = this.norm(l2);
    const directSubs = (top.subcategory ?? []).filter(s => this.norm(s.category) === subName);
    if (directSubs.length) return directSubs.flatMap(s => this.walkProducts(s));

    // Fallback: filtrar por product.category en todo el Top
    return this.walkProducts(top).filter(p => this.norm(p.category) === subName);
  });
}
