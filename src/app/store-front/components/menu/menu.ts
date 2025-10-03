import { Component, computed, inject } from '@angular/core';
import { MenuItemCard } from '../menu-item-card/menu-item-card';
import { MenuService } from '../../services/menu-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Product } from '../../models/menu';
import { CategoryService } from '../../services/category-service';

@Component({
  selector: 'app-menu',
  imports: [MenuItemCard],
  templateUrl: './menu.html'
})
export class Menu {
  menuService = inject(MenuService);
  categoryService = inject(CategoryService);

  menuResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.menuService.getMenu();
    }
  });

  // Extraer TODOS los productos de cualquier estructura (plana o anidada)
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
