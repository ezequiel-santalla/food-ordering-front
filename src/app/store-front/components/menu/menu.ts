import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuService } from '../../services/menu.service';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { MenuItemDetailModal } from '../menu-item-detail-modal/menu-item-detail-modal';
import { Product } from '../../models/menu.interface';

type MenuNode = {
  name: string;
  subcategory?: MenuNode[];
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

  // Carga del árbol
  menuResource = rxResource({
    stream: () => this.menuService.getMenuNodes(),
  });

  // Jerarquía (L1/L2/L3)
  selectedL1 = signal<'all' | string>('all');
  selectedL2 = signal<'all' | string>('all');
  selectedL3 = signal<'all' | string>('all');

  tree = computed(() => this.menuResource.value()?.menu ?? []);

  level1 = computed(() => this.tree().map(n => n.name));

  level2 = computed(() => {
    const l1 = this.selectedL1();
    if (l1 === 'all') return [];
    const n1 = this.tree().find(n => n.name === l1);
    return n1?.subcategory?.map(s => s.name) ?? [];
  });

  level3 = computed(() => {
    const l1 = this.selectedL1();
    const l2 = this.selectedL2();
    if (l1 === 'all' || l2 === 'all') return [];
    const n1 = this.tree().find(n => n.name === l1);
    const n2 = n1?.subcategory?.find(s => s.name === l2);
    return n2?.subcategory?.map(s => s.name) ?? [];
  });

  products = computed(() => {
    const l1 = this.selectedL1();
    const l2 = this.selectedL2();
    const l3 = this.selectedL3();

    const collect = (nodes?: MenuNode[]): Product[] => {
      if (!nodes) return [];
      const out: Product[] = [];
      const walk = (n: MenuNode) => {
        if (n.products) out.push(...n.products);
        n.subcategory?.forEach(walk);
      };
      nodes.forEach(walk);
      return out;
    };

    const root = this.tree();
    if (l1 === 'all') return collect(root);

    const n1 = root.find(n => n.name === l1);
    if (!n1) return [];

    if (l2 === 'all') return collect([n1]);

    const n2 = n1.subcategory?.find(s => s.name === l2);
    if (!n2) return [];

    if (l3 === 'all') return collect([n2]);

    const n3 = n2.subcategory?.find(s => s.name === l3);
    return collect(n3 ? [n3] : []);
  });

  // handlers jerárquicos
  selectL1(v: 'all' | string) { this.selectedL1.set(v); this.selectedL2.set('all'); this.selectedL3.set('all'); }
  selectL2(v: 'all' | string) { this.selectedL2.set(v); this.selectedL3.set('all'); }
  selectL3(v: 'all' | string) { this.selectedL3.set(v); }
}
