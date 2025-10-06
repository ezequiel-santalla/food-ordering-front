import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Menu, Product } from '../models/menu.interface';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private http = inject(HttpClient);

  getMenu(): Observable<Menu> {
    return this.http
      .get<Menu>(`${environment.baseUrl}/public/food-venues/c74ec4db-d5f2-4a57-9194-311155f8d112/menu/categories`)
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
          .slice(0, 20);
      })
    );
  }
}
