import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Menu, MenuElement, Product } from '../models/menu.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

type MenuNode = {
  name: string;
  subcategory: MenuNode[];
  products: Product[];
};

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private http = inject(HttpClient);

  getMenu(): Observable<Menu> {
    return this.http.get<Menu>(`${environment.baseUrl}/menus`);
  }

  getMenuNodes(): Observable<{
    menu: MenuNode[];
    foodVenueName?: string;
    foodVenueImageUrl?: string;
  }> {
    return this.getMenu().pipe(
      map((data) => ({
        menu: this.mapElementsToNodes(data?.menu ?? []),
        foodVenueName: data?.foodVenueName,
        foodVenueImageUrl: data?.foodVenueImageUrl,
      }))
    );
  }

  private mapElementsToNodes(elements: MenuElement[] | undefined): MenuNode[] {
    if (!elements?.length) return [];
    return elements.map((el) => this.mapAnyNode(el));
  }

  private mapAnyNode(node: {
    category: string;
    subcategory?: any[];
    products?: Product[];
  }): MenuNode {
    const name = String(node.category ?? '').trim();
    const products: Product[] = Array.isArray(node.products) ? node.products : [];
    const subs = Array.isArray(node.subcategory) ? node.subcategory : [];

    return {
      name,
      products,
      subcategory: subs.map((sub) => this.mapAnyNode(sub)),
    };
  }

  getRecommendations(): Observable<Product[]> {
    return this.getMenuNodes().pipe(
      map(({ menu }) => {
        const all: Product[] = [];
        const collect = (nodes: MenuNode[]) => {
          for (const n of nodes) {
            if (n.products?.length) all.push(...n.products);
            if (n.subcategory?.length) collect(n.subcategory);
          }
        };
        collect(menu);
        return all.sort(() => Math.random() - 0.5).slice(0, 20);
      })
    );
  }

  getMenuItemByName(name: string): Observable<Product | null> {
    const decodedName = decodeURIComponent(name);
    const normalizedName = decodedName.trim().toLowerCase();
    const encodedName = encodeURIComponent(normalizedName);
    const url = `${environment.baseUrl}/products/find-by-name/${encodedName}`;

    console.log('🔍 === DEBUG GET PRODUCT ===');
    console.log('📝 Nombre recibido (raw):', name);
    console.log('📝 Nombre decodificado:', decodedName);
    console.log('📝 Nombre normalizado:', normalizedName);
    console.log('📝 Nombre codificado:', encodedName);
    console.log('🌐 URL completa:', url);

    return this.http.get<Product>(url).pipe(
      tap((product) => {
        console.log('✅ Producto encontrado:', product);
      }),
      catchError((error) => {
        console.error('❌ === ERROR GET PRODUCT ===');
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('URL que falló:', error.url);
        console.error('Error completo:', error);

        return of(null);
      })
    );
  }
}
