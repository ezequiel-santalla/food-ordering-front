import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { TableSessionInfo } from '../models/table-session.interface';

@Injectable({ providedIn: 'root' })
export class TableSessionService {
  private authService = inject(AuthService);

  private _tableNumber = signal<number>(0);
  private _participantCount = signal<number>(0);

  tableSessionInfo = computed<TableSessionInfo>(() => ({
    tableNumber: this._tableNumber(),
    participantCount: this._participantCount(),
    sessionId: this.authService.tableSessionId()
  }));

  hasActiveSession = computed(() => this.authService.tableSessionId() !== null);

  setTableSessionInfo(tableNumber: number, participantCount: number) {
    this._tableNumber.set(tableNumber);
    this._participantCount.set(participantCount);
  }

  clearSession() {
    this._tableNumber.set(0);
    this._participantCount.set(0);
  }
}
