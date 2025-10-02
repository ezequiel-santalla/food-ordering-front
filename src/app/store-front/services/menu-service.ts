import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Menu, Product } from '../models/menu';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private http = inject(HttpClient);

  getMenu(): Observable<Menu> {
    return this.http
      .get<Menu>(`${environment.apiUrl}/public/food-venues/46b63071-f6fb-48bf-a2e0-4f7144e5a09b/menu/categories`)
  }

  getRecommendations(): Observable<Product[]> {
    return this.getMenu().pipe(
      map(menuData => {
        const allProducts: Product[] = [];

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

        // Puedes filtrar/ordenar aquí
        // Por ejemplo, los primeros 5 productos aleatorios:
        return allProducts
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);
      })
    );
  }
}
