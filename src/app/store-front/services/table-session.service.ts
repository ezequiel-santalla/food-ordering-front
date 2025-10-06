import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

export interface TableSessionInfo {
  tableNumber: number;
  participantCount: number;
  sessionId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TableSessionService {

  private authService = inject(AuthService);

  private _tableSessionInfo = signal<TableSessionInfo>({
    tableNumber: 0,
    participantCount: 0,
    sessionId: null
  });

  tableSessionInfo = computed(() => this._tableSessionInfo());

  // Método para actualizar la info desde el scan QR
  setTableSessionInfo(tableNumber: number, participantCount: number) {
    const sessionId = this.authService.tableSessionId();
    this._tableSessionInfo.set({
      tableNumber,
      participantCount,
      sessionId
    });
  }

  // Limpiar sesión
  clearSession() {
    this._tableSessionInfo.set({
      tableNumber: 0,
      participantCount: 0,
      sessionId: null
    });
  }

  // Verificar si hay sesión activa
  hasActiveSession = computed(() => {
    return this._tableSessionInfo().sessionId !== null;
  });
}
