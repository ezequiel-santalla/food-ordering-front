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

type VenueCachePayload<T> = {
  value: T;
  expiresAt: number;
  venueId: string | null;
};

type PageResponse<T> = {
  content?: T[];
  items?: T[];
  data?: T[];
};

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateManager);

  private CACHE_KEY = 'dinno-menu-cache-v1';
  private VENUE_KEY = 'dinno-menu-venue-id';
  private CACHE_TTL = 10 * 60 * 1000;

  private TOP_CACHE_KEY = 'dinno-top-selling-v1';
  private TOP_CACHE_TTL = 2 * 60 * 1000;

  private REC_CACHE_KEY = 'dinno-recommended-v1';
  private REC_CACHE_TTL = 2 * 60 * 1000;

  private saveVenueCache<T>(key: string, value: T, ttlMs: number) {
    const payload: VenueCachePayload<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
      venueId: this.authState.foodVenueId(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  private loadVenueCache<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as VenueCachePayload<T>;

      if (parsed.venueId && parsed.venueId !== this.authState.foodVenueId())
        return null;

      if (Date.now() > parsed.expiresAt) return null;

      return parsed.value;
    } catch {
      return null;
    }
  }

  private toArray<T>(resp: PageResponse<T> | T[] | any): T[] {
    if (Array.isArray(resp)) return resp;
    return (resp?.content ?? resp?.items ?? resp?.data ?? []) as T[];
  }

  private saveMenuCache(data: Menu) {
    const payload = { value: data, expiresAt: Date.now() + this.CACHE_TTL };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(payload));

    const currentVenueId = this.authState.foodVenueId();
    if (currentVenueId) localStorage.setItem(this.VENUE_KEY, currentVenueId);
  }

  private loadMenuCache(): Menu | null {
    const currentVenueId = this.authState.foodVenueId();
    const cachedVenueId = localStorage.getItem(this.VENUE_KEY);

    if (currentVenueId && cachedVenueId && currentVenueId !== cachedVenueId) {
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
    localStorage.removeItem(this.TOP_CACHE_KEY);
    localStorage.removeItem(this.REC_CACHE_KEY);
  }

  getMenu(): Observable<Menu> {
    const cached = this.loadMenuCache();
    if (cached) return of(cached);

    return this.http
      .get<Menu>(`${environment.baseUrl}/menus`)
      .pipe(tap((data) => this.saveMenuCache(data)));
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

  getRecommended(limit = 20): Observable<Product[]> {
    const cached = this.loadVenueCache<Product[]>(this.REC_CACHE_KEY);
    if (cached) return of(cached);

    return this.http
      .get<PageResponse<Product> | Product[]>(
        `${environment.baseUrl}/products/featured/recommended`,
        { params: { limit: String(limit) } }
      )
      .pipe(
        map((resp) => this.toArray<Product>(resp)),
        tap((items) =>
          this.saveVenueCache(this.REC_CACHE_KEY, items, this.REC_CACHE_TTL)
        ),
        catchError(() => of([]))
      );
  }

  getTopSelling(limit = 5, days = 30): Observable<Product[]> {
    const cached = this.loadVenueCache<Product[]>(this.TOP_CACHE_KEY);
    if (cached) return of(cached);

    return this.http
      .get<PageResponse<Product> | Product[]>(
        `${environment.baseUrl}/products/top-selling`,
        { params: { limit: String(limit), days: String(days) } }
      )
      .pipe(
        map((resp) => this.toArray<Product>(resp)),
        tap((items) =>
          this.saveVenueCache(this.TOP_CACHE_KEY, items, this.TOP_CACHE_TTL)
        ),
        catchError(() => of([]))
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
