import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { TableSessionInfo } from '../../shared/models/table-session';
import { SessionUtils } from '../../utils/session-utils';

@Injectable({ providedIn: 'root' })
export class TableSessionService {

  private authService = inject(AuthService);

  // Inicializar desde localStorage
  private _tableNumber = signal<number>(this.getStoredNumber('tableNumber'));
  private _participantNickname = signal<string>(this.getStoredString('participantNickname'));
  private _participantCount = signal<number>(this.getStoredNumber('participantCount'));

  tableSessionInfo = computed<TableSessionInfo>(() => ({
    tableNumber: this._tableNumber(),
    participantNickname: this._participantNickname(),
    participantCount: this._participantCount(),
    // Usar tableSessionId de AuthService que ya está sincronizado con localStorage
    sessionId: this.authService.tableSessionId()
  }));

  hasActiveSession = computed(() => {
    const sessionId = this.authService.tableSessionId();
    return SessionUtils.isValidSession(sessionId);
  });

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
      console.log('✅ TableNumber guardado:', tableNumber);
    } else {
      this._tableNumber.set(0);
      localStorage.removeItem('tableNumber');
    }

    // Validar y guardar participantNickname
    if (participantNickname && participantNickname.trim()) {
      this._participantNickname.set(participantNickname);
      localStorage.setItem('participantNickname', participantNickname);
      console.log('✅ ParticipantNickname guardado:', participantNickname);
    } else {
      this._participantNickname.set('');
      localStorage.removeItem('participantNickname');
    }

    // Validar y guardar participantCount
    if (participantCount >= 0) {
      this._participantCount.set(participantCount);
      localStorage.setItem('participantCount', participantCount.toString());
      console.log('✅ ParticipantCount guardado:', participantCount);
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
      if (!stored) {
        return 0;
      }

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
