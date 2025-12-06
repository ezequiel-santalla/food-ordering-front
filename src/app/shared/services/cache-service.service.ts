import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheService {
  save(key: string, value: any, ttlMs: number) {
    const payload = {
      value,
      expiresAt: Date.now() + ttlMs
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const { value, expiresAt } = JSON.parse(raw);

      if (Date.now() > expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return value as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  clear(key: string) {
    localStorage.removeItem(key);
  }
}
