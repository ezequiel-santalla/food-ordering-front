import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { ProfileService } from './profile.service';
import { TableSessionInfo } from '../../shared/models/table-session';
import { SessionUtils } from '../../utils/session-utils';

@Injectable({ providedIn: 'root' })
export class TableSessionService {

  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  // Signals privados
  private _tableNumber = signal<number>(this.getStoredNumber('tableNumber'));
  private _participantNickname = signal<string>(this.getStoredString('participantNickname'));
  private _participantCount = signal<number>(this.getStoredNumber('participantCount'));

  // Computed público que combina todo
  tableSessionInfo = computed<TableSessionInfo>(() => ({
    tableNumber: this._tableNumber(),
    participantNickname: this._participantNickname(),
    participantCount: this._participantCount(),
    sessionId: this.authService.tableSessionId()
  }));

  hasActiveSession = computed(() => {
    const sessionId = this.authService.tableSessionId();
    return SessionUtils.isValidSession(sessionId);
  });

  constructor() {
    // Sincronizar nickname cuando haya sesión activa
    effect(() => {
      if (this.hasActiveSession()) {
        this.syncNicknameFromProfile();
      }
    });
  }

  /**
   * Sincroniza el nickname desde el perfil del usuario
   * Se llama automáticamente cuando hay sesión activa
   */
  private syncNicknameFromProfile(): void {
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        const currentNickname = this._participantNickname();
        const profileName = profile.name || 'Usuario';

        // Solo actualizar si cambió
        if (currentNickname !== profileName) {
          console.log('🔄 Sincronizando nickname desde perfil:', profileName);
          this._participantNickname.set(profileName);
          localStorage.setItem('participantNickname', profileName);
        }
      },
      error: (error) => {
        console.warn('⚠️ No se pudo sincronizar nickname desde perfil:', error);
      }
    });
  }

  /**
   * Fuerza la sincronización del nickname
   * Útil después de actualizar el perfil
   */
  refreshNickname(): void {
    if (this.hasActiveSession()) {
      this.syncNicknameFromProfile();
    }
  }

  setTableSessionInfo(
    tableNumber: number,
    participantNickname: string,
    participantCount: number
  ): void {
    console.log('📝 Guardando info de mesa:', {
      tableNumber,
      participantNickname,
      participantCount
    });

    // Validar y guardar tableNumber
    if (tableNumber > 0) {
      this._tableNumber.set(tableNumber);
      localStorage.setItem('tableNumber', tableNumber.toString());
    } else {
      this._tableNumber.set(0);
      localStorage.removeItem('tableNumber');
    }

    // Validar y guardar participantNickname
    if (participantNickname && participantNickname.trim()) {
      this._participantNickname.set(participantNickname);
      localStorage.setItem('participantNickname', participantNickname);
    } else {
      this._participantNickname.set('');
      localStorage.removeItem('participantNickname');
    }

    // Validar y guardar participantCount
    if (participantCount >= 0) {
      this._participantCount.set(participantCount);
      localStorage.setItem('participantCount', participantCount.toString());
    } else {
      this._participantCount.set(0);
      localStorage.removeItem('participantCount');
    }

    console.log('💾 Estado actual de tableSessionInfo:', this.tableSessionInfo());
  }

  clearSession(): void {
    console.log('🧹 Limpiando sesión de mesa');

    this._tableNumber.set(0);
    this._participantNickname.set('');
    this._participantCount.set(0);

    localStorage.removeItem('tableNumber');
    localStorage.removeItem('participantNickname');
    localStorage.removeItem('participantCount');
  }

  private getStoredNumber(key: string): number {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return 0;

      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      console.error(`Error leyendo número de localStorage para ${key}:`, error);
      return 0;
    }
  }

  private getStoredString(key: string): string {
    try {
      const stored = localStorage.getItem(key);
      return stored && stored.trim() ? stored : '';
    } catch (error) {
      console.error(`Error leyendo string de localStorage para ${key}:`, error);
      return '';
    }
  }
}
