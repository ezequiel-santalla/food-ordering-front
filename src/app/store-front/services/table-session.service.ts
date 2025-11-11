import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { ProfileService } from './profile.service';
import { TableSessionInfo } from '../../shared/models/table-session';
import { SessionUtils } from '../../utils/session-utils';
import { ServerSentEventsService } from '../../shared/services/server-sent-events.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthStateManager } from '../../auth/services/auth-state-manager.service';
import { TokenManager } from '../../utils/token-manager';

@Injectable({ providedIn: 'root' })
export class TableSessionService {
  private authService = inject(AuthService);
  private authState = inject(AuthStateManager);
  private profileService = inject(ProfileService);
  private sseService = inject(ServerSentEventsService);
  private http = inject(HttpClient);

  // Signals privados
  private _tableNumber = signal<number>(this.getStoredNumber('tableNumber'));
  private _participantNickname = signal<string>(
    this.getStoredString('participantNickname')
  );
  private _participantCount = signal<number>(
    this.getStoredNumber('participantCount')
  );
  private _participantId = signal<string>(
    this.getStoredString('participantId')
  );

  private _tableCapacity = signal<number>(
    this.getStoredNumber('tableCapacity')
  );

  private sseSubscription: Subscription | undefined;

  tableSessionInfo = computed<TableSessionInfo>(() => ({
    tableNumber: this._tableNumber(),
    participantNickname: this._participantNickname(),
    participantId: this._participantId(),
    participantCount: this._participantCount(),
    sessionId: this.authService.tableSessionId(),
    tableCapacity: this._tableCapacity(),
  }));

  hasActiveSession = computed(() => {
    const sessionId = this.authService.tableSessionId();
    return SessionUtils.isValidSession(sessionId);
  });

  constructor(private router: Router) {
    effect(() => {
      if (this.hasActiveSession() && !this.authState.isGuest()) {
        this.syncNicknameFromProfile();
      }
    });

    effect(
      (onCleanup) => {
        const tableSessionId = this.authService.tableSessionId();

        // ¿Hay una sesión activa y tenemos un ID de mesa?
        if (this.hasActiveSession() && tableSessionId) {
          // --- SÍ: Nos conectamos al SSE ---
          console.log(`🔌 Conectando a SSE para mesa:`);

          // Usamos el SseService para suscribirnos
          this.sseSubscription = this.sseService
            .subscribeToSession()
            .subscribe({
              next: (event) => {
                console.log(
                  'Evento SSE recibido en TableSessionService:',
                  event
                );

                if (event.type === 'count-updated') {
                  const newCount = event.payload.count;
                  if (typeof newCount === 'number') {
                    console.log(
                      `[SSE count-updated] Recibido conteo: ${newCount}. Actualizando signal...`
                    );
                    this._participantCount.set(newCount);
                  } else {
                    console.warn(
                      '[SSE count-updated] Payload inválido:',
                      event.payload
                    );
                  }
                }

                if (event.type === 'user-joined') {
                  console.log('[SSE user-joined] Incrementando contador');
                  this._participantCount.update((count) => count + 1);
                }
              },
              error: (err) =>
                console.error(
                  `Error en conexión SSE para mesa ${tableSessionId}:`,
                  err
                ),
            });
        }

        // --- Función de limpieza (se llama cuando el effect "muere") ---
        // Esto se ejecutará cuando `hasActiveSession()` se vuelva `false`
        onCleanup(() => {
          if (this.sseSubscription) {
            console.log(`🔌 Desconectando de SSE para mesa: ${tableSessionId}`);
            this.sseSubscription.unsubscribe(); // Cerramos la conexión
            this.sseSubscription = undefined;
          }
        });
      }
    );
  }

  /**
   * Sincroniza el nickname desde el perfil del usuario
   * Se llama automáticamente cuando hay sesión activa (solo para usuarios con cuenta)
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
      },
    });
  }

  /**
   * Fuerza la sincronización del nickname
   * Útil después de actualizar el perfil
   */
  refreshNickname(): void {
    // ✅ Solo sincronizar si NO es invitado
    if (this.hasActiveSession() && !this.authState.isGuest()) {
      this.syncNicknameFromProfile();
    }
  }

  /**
   * Actualiza solo el nickname (para usuarios con cuenta)
   * Útil cuando se actualiza el perfil manualmente
   */
  updateNickname(newNickname: string): void {
    if (newNickname && newNickname.trim()) {
      console.log('✅ Actualizando nickname:', newNickname);
      this._participantNickname.set(newNickname);
      localStorage.setItem('participantNickname', newNickname);
    }
  }

  setTableSessionInfo(
    tableNumber: number,
    participantNickname: string,
    participantCount: number,
    tableCapacity: number,
    participantId?: string
  ): void {
    console.log('📝 Guardando info de mesa:', {
      tableNumber,
      participantNickname,
      participantCount,
      tableCapacity,
      participantId,
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

    if (tableCapacity >= 0) {
      this._tableCapacity.set(tableCapacity);
      localStorage.setItem('tableCapacity', tableCapacity.toString());
    } else {
      this._tableCapacity.set(0);
      localStorage.removeItem('tableCapacity');
    }

    if (participantId && participantId.trim()) {
      this._participantId.set(participantId);
      localStorage.setItem('participantId', participantId);
      console.log('💾 ParticipantId guardado:', participantId);
    } else {
      // Intentar obtenerlo del token como fallback
      const tokenParticipantId = this.authService.participantId();
      if (tokenParticipantId) {
        this._participantId.set(tokenParticipantId);
        localStorage.setItem('participantId', tokenParticipantId);
        console.log('💾 ParticipantId obtenido del token:', tokenParticipantId);
      }
    }

    console.log(
      '💾 Estado actual de tableSessionInfo:',
      this.tableSessionInfo()
    );
  }

  clearSession(): void {
    console.log('🧹 Limpiando sesión de mesa');

    this._tableNumber.set(0);
    this._participantNickname.set('');
    this._participantCount.set(0);
    this._participantId.set('');
    this._tableCapacity.set(0);

    localStorage.removeItem('tableNumber');
    localStorage.removeItem('participantNickname');
    localStorage.removeItem('participantCount');
    localStorage.removeItem('participantId');
    localStorage.removeItem('tableCapacity');
  }

  //Esto podria estar en un servicio dedicado al participante actual
  closeSession(): void {
    console.log('Cerrando sesión de mesa');

    this.http
      .patch<any>(`${environment.baseUrl}/participants/end`, null, {
        observe: 'response',
      })
      .subscribe({
        next: (response) => {
          if (response.status === 200) {
            const processed = TokenManager.processAuthResponse(response.body);
            this.authState.applyAuthData(processed);
          } else {
            this.authState.clearState();
          }
          console.log('Sesión cerrada exitosamente', response);
          this.router.navigate(['/food-venues']);
        },
        error: (err) => {
          console.error('Error al cerrar la sesión', err);
        },
      });
  }

  leaveSession(): void {
    console.log('Abandonando sesión de mesa');

    this.http
      .patch<any>(
        `${environment.baseUrl}/participants/leave`,
        null, // <--- ESTA ES LA CORRECCIÓN: el body es null
        { observe: 'response' } // <--- Ahora SÍ es el objeto de opciones
      )
      .subscribe({
        next: (response) => {
          // 'response' AHORA SÍ es un HttpResponse

          // Tu controller devuelve 200 (con body) o 204 (sin body)
          // Esta lógica maneja ambos casos
          if (response.status === 200 && response.body) {
            // Caso 1: Vino un 200 OK con el AuthResponse
            const processed = TokenManager.processAuthResponse(response.body);
            this.authState.applyAuthData(processed);
          } else {
            // Caso 2: Vino un 204 No Content (o un 200 sin body)
            this.authState.clearState();
          }

          this.clearSession();

          console.log('El participante dejó la sesión', response);
          this.router.navigate(['/food-venues']);
        },
        error: (err) => {
          console.error('Error al abandonar la sesión', err);
        },
      });
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
