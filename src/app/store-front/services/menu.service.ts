import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Menu, Product } from '../models/menu.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private http = inject(HttpClient);

  getMenu(): Observable<Menu> {
    return this.http.get<Menu>(`${environment.baseUrl}/menus`);
  }

  getMenuItemByName(name: string): Observable<Product | null> {
    // Decodificar primero (por si viene codificado)
    const decodedName = decodeURIComponent(name);
    // Normalizar: trim + lowercase
    const normalizedName = decodedName.trim().toLowerCase();
    // Codificar para la URL (maneja espacios y caracteres especiales)
    const encodedName = encodeURIComponent(normalizedName);
    const url = `${environment.baseUrl}/products/find-by-name/${encodedName}`;

    console.log('🔍 === DEBUG GET PRODUCT ===');
    console.log('📝 Nombre recibido (raw):', name);
    console.log('📝 Nombre decodificado:', decodedName);
    console.log('📝 Nombre normalizado:', normalizedName);
    console.log('📝 Nombre codificado:', encodedName);
    console.log('🌐 URL completa:', url);

    return this.http.get<Product>(url).pipe(
      tap(product => {
        console.log('✅ Producto encontrado:', product);
      }),
      catchError(error => {
        console.error('❌ === ERROR GET PRODUCT ===');
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('URL que falló:', error.url);
        console.error('Error completo:', error);

        return of(null);
      })
    );
  }

  getRecommendations(): Observable<Product[]> {
    console.log('🎲 Obteniendo recomendaciones...');

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
