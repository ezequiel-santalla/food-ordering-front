import { Component, computed, inject, signal } from '@angular/core';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { MenuService } from '../../services/menu.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Product } from '../../models/menu.interface';
import { CategoryService } from '../../services/category.service';
import { MenuItemDetailModal } from "../menu-item-detail-modal/menu-item-detail-modal";

@Component({
  selector: 'app-menu',
  imports: [MenuItemCard, MenuItemDetailModal],
  templateUrl: './menu.html'
})
export class Menu {

  menuService = inject(MenuService);
  categoryService = inject(CategoryService);

  // ✅ Cambiar a signal
  selectedProduct = signal<Product | undefined>(undefined);

  openProduct(product: Product) {
  console.log('openProduct called with:', product);
  console.log('Setting selectedProduct signal');
  this.selectedProduct.set(product);
  console.log('selectedProduct value:', this.selectedProduct());
}

  closeModal() {
    this.selectedProduct.set(undefined);
  }

  menuResource = rxResource({
    stream: () => {
      return this.menuService.getMenu();
    }
  });

  allProducts = computed(() => {
    const menuData = this.menuResource.value();
    if (!menuData) return [];

    const products: Product[] = [];

    menuData.menu.forEach(category => {
      // Si tiene productos directos (estructura plana)
      if (category.products) {
        products.push(...category.products);
      }

      // Si tiene subcategorías (estructura anidada)
      if (category.subcategory) {
        category.subcategory.forEach(sub => {
          if (sub.products) {
            products.push(...sub.products);
          }

          // Sub-subcategorías
          if (sub.subcategory) {
            sub.subcategory.forEach(subSub => {
              if (subSub.products) {
                products.push(...subSub.products);
              }
            });
          }
        });
      }
    });

    return products;
  });

  // Agrupar productos por su categoría real (del objeto category dentro de product)
  groupedByCategory = computed(() => {
    const products = this.allProducts();
    const grouped = new Map<string, Product[]>();

    products.forEach(product => {
      const categoryName = product.category;
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)!.push(product);
    });

    return grouped;
  });

  // Obtener categorías únicas
  categories = computed(() => {
    return Array.from(this.groupedByCategory().keys());
  });

  filteredCategories = computed(() => {
    const selected = this.categoryService.selectedCategory();
    const allCategories = this.categories();

    if (selected === 'all') {
      return allCategories;
    }

    return allCategories.filter(cat => cat.toLowerCase() === selected);
  });

  // Helper para obtener productos de una categoría
  getProductsByCategory(category: string): Product[] {
    return this.groupedByCategory().get(category) || [];
  }
}
