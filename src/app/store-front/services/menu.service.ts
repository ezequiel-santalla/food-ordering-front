import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Menu, Product } from '../models/menu.interface';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private http = inject(HttpClient);

  getMenu(): Observable<Menu> {
    return this.http.get<Menu>(`${environment.baseUrl}/menus`)
  }

  getMenuItemByPublicId(publicId: string): Observable<Product | null> {
    return this.http.get<Product>(`${environment.baseUrl}/products/${publicId}`)
  }

  getRecommendations(): Observable<Product[]> {
    return this.getMenu().pipe(
      map(menuData => {
        const allProducts: Product[] = [];

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

        return allProducts
          .sort(() => Math.random() - 0.5)
          .slice(0, 20);
      })
    );
  }
}
