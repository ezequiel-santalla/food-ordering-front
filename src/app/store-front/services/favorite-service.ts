import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed, effect } from '@angular/core';
import {
  catchError,
  map,
  of,
  startWith,
  Subject,
  Subscription,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStateManager } from '../../auth/services/auth-state-manager-service';
import {
  FavoriteIdsResponseDto,
  FavoriteToggleResponseDto,
} from '../models/favorite-product.interface';
import { Product } from '../models/menu.interface';
import { ServerSentEventsService } from '../../shared/services/server-sent-events.service';

type VenueCachePayload<T> = {
  value: T;
  expiresAt: number;
  venueId: string | null;
};

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateManager);
  private sse = inject(ServerSentEventsService);

  private IDS_CACHE_KEY = 'dinno-favorites-ids-v1';
  private IDS_TTL = 60 * 1000; // 1 min (ajustable)

  private favoriteIds = signal<Set<string>>(new Set());
  readonly favoritesCount = computed(() => this.favoriteIds().size);
  readonly favoriteIdsSet = computed(() => this.favoriteIds());

  private reloadFavorites$ = new Subject<void>();

  favoritesList$ = this.reloadFavorites$.pipe(
    startWith(void 0),
    switchMap(() => this.getFavorites(0, 20))
  );

  private userSseSub?: Subscription;

  constructor() {
    effect((cleanup) => {
      const isAuth = this.authState.isAuthenticated();
      const venueId = this.authState.foodVenueId();

      this.userSseSub?.unsubscribe();
      this.userSseSub = undefined;

      if (!isAuth || !venueId) {
        this.clearCache();
        return;
      }

      this.loadFavoriteIds().subscribe();

      this.userSseSub = this.sse.subscribeToUser().subscribe({
        next: ({ type, payload }) => {
          console.log('🟢 USER SSE EVENT:', type, payload);
          if (type !== 'favorite-updated') return;

          console.log('❤️ FAVORITE UPDATED OK:', payload);
          if (payload?.foodVenueId && payload.foodVenueId !== venueId) return;

          this.applyToggle(payload as FavoriteToggleResponseDto);

          this.reloadFavorites$.next();
        },
      });

      cleanup(() => {
        this.userSseSub?.unsubscribe();
        this.userSseSub = undefined;
      });
    });
  }

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

  getFavorites(page = 0, size = 20) {
    if (!this.authState.isAuthenticated()) {
      return of([] as Product[]);
    }
    return this.http
      .get<any>(`${environment.baseUrl}/products/favorites`, {
        params: { page: String(page), size: String(size) },
      })
      .pipe(
        map(
          (resp) =>
            (resp?.content ??
              resp?.items ??
              resp?.data ??
              resp ??
              []) as Product[]
        ),
        catchError(() => of([] as Product[]))
      );
  }

  clearCache() {
    localStorage.removeItem(this.IDS_CACHE_KEY);
    this.favoriteIds.set(new Set());
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds().has(productId);
  }

  loadFavoriteIds() {
    if (!this.authState.isAuthenticated()) {
      this.clearCache();
      return of(new Set<string>());
    }

    const cached = this.loadVenueCache<FavoriteIdsResponseDto>(
      this.IDS_CACHE_KEY
    );
    if (cached?.productIds) {
      const set = new Set(cached.productIds);
      this.favoriteIds.set(set);
      return of(set);
    }

    return this.http
      .get<FavoriteIdsResponseDto>(
        `${environment.baseUrl}/products/favorites/ids`
      )
      .pipe(
        map((resp) => new Set(resp.productIds ?? [])),
        tap((set) => {
          this.favoriteIds.set(set);
          this.saveVenueCache(
            this.IDS_CACHE_KEY,
            {
              foodVenueId: this.authState.foodVenueId() ?? '',
              productIds: Array.from(set),
            } as FavoriteIdsResponseDto,
            this.IDS_TTL
          );
        }),
        catchError(() => {
          this.clearCache();
          return of(new Set<string>());
        })
      );
  }

  toggle(productId: string) {
    if (!this.authState.isAuthenticated()) {
      return throwError(() => new Error('AUTH_REQUIRED'));
    }
    return this.http
      .post<FavoriteToggleResponseDto>(
        `${environment.baseUrl}/products/favorites/${productId}/toggle`,
        {}
      )
      .pipe(
        tap((res) => {
          this.applyToggle(res);
          this.reloadFavorites$.next();
        })
      );
  }

  applyToggle(res: FavoriteToggleResponseDto) {
    const set = new Set(this.favoriteIds());
    if (res.isFavorite) set.add(res.productId);
    else set.delete(res.productId);

    this.favoriteIds.set(set);

    this.saveVenueCache(
      this.IDS_CACHE_KEY,
      {
        foodVenueId: res.foodVenueId,
        productIds: Array.from(set),
      },
      this.IDS_TTL
    );
  }
}
