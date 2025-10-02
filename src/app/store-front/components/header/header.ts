import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Bell, User, QrCode } from 'lucide-angular';
import { MenuService } from '../../services/menu-service';
import { CategoryService } from '../../services/category-service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './header.html'
})
export class Header {
  readonly Bell = Bell;
  readonly User = User;
  readonly QrCode = QrCode;

  menuService = inject(MenuService);
  categoryService = inject(CategoryService);

  // Cargar el menú
  menuResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.menuService.getMenu();
    }
  });

  // Extraer categorías únicas del menú
  categories = computed(() => {
    const menuData = this.menuResource.value();
    if (!menuData) return [{ id: 'all', name: 'Todos' }];

    const allProducts: any[] = [];

    // Extraer todos los productos
    menuData.menu.forEach(category => {
      if (category.products) {
        allProducts.push(...category.products);
      }

      if (category.subcategory) {
        category.subcategory.forEach(sub => {
          if (sub.products) {
            allProducts.push(...sub.products);
          }

          if (sub.subcategory) {
            sub.subcategory.forEach(subSub => {
              if (subSub.products) {
                allProducts.push(...subSub.products);
              }
            });
          }
        });
      }
    });

    // Obtener categorías únicas
    const uniqueCategories = new Map<string, string>();
    allProducts.forEach(product => {
      uniqueCategories.set(product.category.name, product.category.name);
    });

    // Crear array de categorías con "Todos" al inicio
    const categoryList = [{ id: 'all', name: 'Todos' }];
    uniqueCategories.forEach((name) => {
      categoryList.push({ id: name.toLowerCase(), name: name });
    });

    return categoryList;
  });

  // Categoría seleccionada del servicio compartido
  selectedCategory = this.categoryService.selectedCategory;

  // Nombre del restaurante
  venueName = computed(() => {
    return this.menuResource.value()?.foodVenueName;
  });

  // Método para cambiar categoría
  selectCategory(categoryId: string) {
    this.categoryService.setCategory(categoryId);
  }
}
