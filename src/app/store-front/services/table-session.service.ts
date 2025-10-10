import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { TableSessionInfo } from '../models/table-session.interface';
import { SessionUtils } from '../../utils/session-utils';

@Injectable({ providedIn: 'root' })
export class TableSessionService {

  private authService = inject(AuthService);

  // Inicializar desde localStorage
  private _tableNumber = signal<number>(this.getStoredNumber('tableNumber'));
  private _participantCount = signal<number>(this.getStoredNumber('participantCount'));

  tableSessionInfo = computed<TableSessionInfo>(() => ({
    tableNumber: this._tableNumber(),
    participantCount: this._participantCount(),
    sessionId: this.authService.tableSessionId()
  }));

  hasActiveSession = computed(() => {
    const sessionId = this.authService.tableSessionId();
    return SessionUtils.isValidSession(sessionId);
  });

  setTableSessionInfo(tableNumber: number, participantCount: number) {
    // Validar que los valores sean válidos
    if (tableNumber > 0) {
      this._tableNumber.set(tableNumber);
      localStorage.setItem('tableNumber', tableNumber.toString());
    }

    if (participantCount >= 0) {
      this._participantCount.set(participantCount);
      localStorage.setItem('participantCount', participantCount.toString());
    }

    console.log('✅ Info de mesa guardada:', { tableNumber, participantCount });
  }

  clearSession() {
    this._tableNumber.set(0);
    this._participantCount.set(0);

    localStorage.removeItem('tableNumber');
    localStorage.removeItem('participantCount');

    console.log('🧹 Info de mesa limpiada');
  }

  private getStoredNumber(key: string): number {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return 0;

      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }
}
