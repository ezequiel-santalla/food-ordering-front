import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Menu, MenuElement, Product } from '../models/menu.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStateManager } from '../../auth/services/auth-state-manager-service';

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
  private authState = inject(AuthStateManager);

  private CACHE_KEY = 'dinno-menu-cache-v1';
  private VENUE_KEY = 'dinno-menu-venue-id';
  private CACHE_TTL = 10 * 60 * 1000;

  private saveCache(data: any) {
    const payload = {
      value: data,
      expiresAt: Date.now() + this.CACHE_TTL,
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(payload));

    const currentVenueId = this.authState.foodVenueId();
    if (currentVenueId) {
      localStorage.setItem(this.VENUE_KEY, currentVenueId);
    }
  }

  private loadCache(): Menu | null {
    const currentVenueId = this.authState.foodVenueId();
    const cachedVenueId = localStorage.getItem(this.VENUE_KEY);

    if (currentVenueId && cachedVenueId && currentVenueId !== cachedVenueId) {
      console.warn(
        `Cambio de FoodVenue detectado (${cachedVenueId} -> ${currentVenueId}). Cache invalidado.`
      );
      this.clearCache();
      return null;
    }

    const raw = localStorage.getItem(this.CACHE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        this.clearCache();
        return null;
      }
      return parsed.value as Menu;
    } catch {
        this.clearCache();
      return null;
    }
  }

  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.VENUE_KEY);
  }

  getMenu(): Observable<Menu> {
    const cached = this.loadCache();

    if (cached) {
      return of(cached);
    }

    return this.http
      .get<Menu>(`${environment.baseUrl}/menus`)
      .pipe(tap((data) => this.saveCache(data)));
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
    const products: Product[] = Array.isArray(node.products)
      ? node.products
      : [];
    const subs = Array.isArray(node.subcategory) ? node.subcategory : [];

    return {
      name,
      products,
      subcategory: subs.map((sub) => this.mapAnyNode(sub)),
    };
  }

  private collectAllProducts(menu: MenuNode[]): Product[] {
    const all: Product[] = [];
    const collect = (nodes: MenuNode[]) => {
      for (const n of nodes) {
        if (n.products?.length) all.push(...n.products);
        if (n.subcategory?.length) collect(n.subcategory);
      }
    };
    collect(menu);
    return all;
  }

  getRecommendations(): Observable<Product[]> {
    return this.getMenuNodes().pipe(
      map(({ menu }) =>
        this.collectAllProducts(menu)
          .sort(() => Math.random() - 0.5)
          .slice(0, 20)
      )
    );
  }

  getHighlights() {
    return this.getMenuNodes().pipe(
      map(({ menu }) =>
        this.collectAllProducts(menu)
          .sort(() => Math.random() - 0.5)
          .slice(0, 20)
      )
    );
  }

  getMyFavorites() {
    return this.getMenuNodes().pipe(
      map(({ menu }) =>
        this.collectAllProducts(menu)
          .sort(() => Math.random() - 0.5)
          .slice(0, 20)
      )
    );
  }

  getMenuItemByName(name: string): Observable<Product | null> {
    const normalized = decodeURIComponent(name).trim().toLowerCase();
    const encoded = encodeURIComponent(normalized);

    return this.http
      .get<Product>(`${environment.baseUrl}/products/find-by-name/${encoded}`)
      .pipe(catchError(() => of(null)));
  }
}
