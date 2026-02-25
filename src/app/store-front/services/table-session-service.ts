import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { AuthService } from '../../auth/services/auth-service';
import { ProfileService } from './profile-service';
import {
  TableSessionInfo,
  TableSessionResponse,
} from '../../shared/models/table-session';
import { SessionUtils } from '../../utils/session-utils';
import { ServerSentEventsService } from '../../shared/services/server-sent-events.service';
import { Observable, Subscription, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthStateManager } from '../../auth/services/auth-state-manager-service';
import { TokenManager } from '../../utils/token-manager';
import { Participant } from '../../shared/models/common';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { FoodVenueService } from '../../food-venues/services/food-venue.service';
import { MenuService } from './menu-service';

@Injectable({ providedIn: 'root' })
export class TableSessionService {
  private authService = inject(AuthService);
  private authState = inject(AuthStateManager);
  private profileService = inject(ProfileService);
  private sseService = inject(ServerSentEventsService);
  private menuService = inject(MenuService);
  private http = inject(HttpClient);
  private sweetAlertService = inject(SweetAlertService);
  private foodVenueService = inject(FoodVenueService);
  private _isLoading = signal<boolean>(true);

  private _tableNumber = signal<number>(this.getStoredNumber('tableNumber'));
  private _participantNickname = signal<string>(
    this.getStoredString('participantNickname')
  );
  private _participantCount = signal<number>(0);
  private _tableCapacity = signal<number | null>(this.getStoredCapacity());
  private _activeParticipants = signal<Participant[]>([]);
  private _previousParticipants = signal<Participant[]>([]);
  private _hostParticipantId = signal<string | null>(null);

  private sseSubscription: Subscription | undefined;
  
  tableSessionInfo = computed<TableSessionInfo>(() => ({
    tableNumber: this._tableNumber(),
    participantNickname: this._participantNickname(),
    participantId: this.authState.participantId() || '',
    participantCount: this._participantCount(),
    sessionId: this.authService.tableSessionId(),
    tableCapacity: this._tableCapacity(),
    activeParticipants: this._activeParticipants(),
    previousParticipants: this._previousParticipants(),
    hostParticipantId: this._hostParticipantId(),
  }));

  hasActiveSession = computed(() => {
    const sessionId = this.authService.tableSessionId();
    return SessionUtils.isValidSession(sessionId);
  });

  sessionId = computed(() => this.authService.tableSessionId());
  myParticipantId = computed(() => this.authState.participantId() || '');

  isLoading = computed(() => this._isLoading());

  constructor() {
    effect(() => {
      if (this.hasActiveSession() && !this.authState.isGuest()) {
        this.syncNicknameFromProfile();
      }
      if (!this.hasActiveSession()) {
        this._isLoading.set(false);
      }
    });

    effect(() => {
      const hasSession = this.hasActiveSession();
      const isGuest = this.authState.isGuest();

      if (hasSession && !isGuest) {
        const currentParticipants = untracked(this._activeParticipants);

        console.log(
          '🔄 Login detectado: Recargando datos de la mesa para actualizar mi nombre...'
        );

        this._isLoading.set(true);
        this.recoverActiveSession().subscribe({
          next: (data) => {
            console.log('✅ Mesa sincronizada post-login', data);
            this._isLoading.set(false);

            const myId = this.authState.participantId();
            const me = data.activeParticipants?.find(
              (p) => p.publicId === myId
            );
            if (me) {
              this.updateNickname(me.nickname);
            }
          },
          error: (err) => {
            console.warn('⚠️ Error sync mesa post-login', err);
            this._isLoading.set(false);
          },
        });
      }
    });

    effect((onCleanup) => {
      const tableSessionId = this.sessionId();
      const hasSession = SessionUtils.isValidSession(tableSessionId);

      if (!hasSession || !tableSessionId) {
        if (this.sseSubscription) {
          console.log(
            `🔌 SSE: cerrando por no-session (prev=${tableSessionId})`,
          );
          this.sseSubscription.unsubscribe();
          this.sseSubscription = undefined;
        }
        return;
      }
      if (this.sseSubscription) return;

      console.log(`🔌 Conectando a SSE para mesa:`);

      this.sseSubscription = this.sseService.subscribeToSession().subscribe({
        next: (event) => {
          console.log('Evento SSE recibido en TableSessionService:', event);

          if (event.type === 'count-updated') {
            const newCount = event.payload.count;
            if (typeof newCount === 'number') {
              console.log(
                `[SSE count-updated] Recibido conteo: ${newCount}. Actualizando signal...`,
              );
              this._participantCount.set(newCount);
            }
          }

          if (event.type === 'user-joined') {
            const newParticipant: Participant = event.payload.participant;
            console.log('[SSE user-joined] ', newParticipant.nickname);

            this._previousParticipants.update((prev) =>
              prev.filter((x) => x.publicId !== newParticipant.publicId),
            );
            this._activeParticipants.update((list) => [
              ...list,
              newParticipant,
            ]);

            this.sweetAlertService.showInfo(
              'Nuevo Participante',
              newParticipant.nickname + ' se unió a la mesa',
            );
          }

          if (event.type === 'user-left' || event.type === 'participant-left') {
            const leavingParticipant = event.payload.participant;

            if (leavingParticipant) {
              console.log('👋 Usuario abandonó:', leavingParticipant.nickname);

              this._activeParticipants.update((active) =>
                active.filter(
                  (p) => p.publicId !== leavingParticipant.publicId,
                ),
              );

              const participantWithTime = {
                ...leavingParticipant,
                leftAt: new Date().toISOString(),
              };

              this._previousParticipants.update((prev) => {
                const filtered = prev.filter(
                  (x) => x.publicId !== participantWithTime.publicId,
                );
                return [...filtered, participantWithTime];
              });

              if (
                leavingParticipant.publicId !== this.authState.participantId()
              ) {
                this.sweetAlertService.showInfo(
                  'Alguien saló',
                  leavingParticipant.nickname + ' abandonó la mesa',
                );
              }
            }
          }

          if (event.type === 'host-delegated') {
            const newHost = event.payload.host;

            console.log('SSE: Nuevo host recibido:', newHost.nickname);

            this._hostParticipantId.set(newHost.publicId);

            this._activeParticipants.update((participants) =>
              participants.map((p) => ({
                ...p,
                ...(p.publicId === newHost.publicId ? newHost : p),
              })),
            );
            if (newHost.publicId === this.authState.participantId()) {
              this.sweetAlertService.showInfo(
                'Fuiste designado como Host',
                'Sos el nuevo anfitrión de la mesa',
              );
            } else {
              this.sweetAlertService.showToast(
                'top-end',
                'info',
                `El nuevo anfitrión es ${newHost.nickname}`,
              );
            }
          }

          if (event.type === 'migrated-guest-session') {
            const payload = event.payload ?? {};
            const updatedParticipant = payload.participant;
            const deletedIds: string[] = payload.deletedParticipantIds ?? [];

            console.log('payload completo:', payload);
            console.log('updatedParticipant:', updatedParticipant);
            console.log('deletedIds:', deletedIds);

            this._previousParticipants.update((prev) =>
              prev.filter(
                (p) =>
                  p.publicId !== updatedParticipant.publicId &&
                  !deletedIds.includes(p.publicId),
              ),
            );

            this._activeParticipants.update((active) => {
              let next = active.filter((p) => !deletedIds.includes(p.publicId));

              const idx = next.findIndex(
                (p) => p.publicId === updatedParticipant.publicId,
              );
              if (idx >= 0) {
                next = next.map((p) =>
                  p.publicId === updatedParticipant.publicId
                    ? { ...p, ...updatedParticipant }
                    : p,
                );
              } else {
                next = [...next, updatedParticipant];
              }
              return next;
            });
            if (
              updatedParticipant.publicId === this.authState.participantId()
            ) {
              this.updateNickname(updatedParticipant.nickname);
            }

            this.sweetAlertService.showToast(
              'top-end',
              'info',
              `${updatedParticipant.nickname} ahora está registrado`,
            );
          }
        },
        error: (err) =>
          console.error(
            `Error en conexión SSE para mesa ${tableSessionId}:`,
            err,
          ),
      });

      onCleanup(() => {
        if (this.sseSubscription) {
          console.log(`🔌 Desconectando de SSE para mesa: ${tableSessionId}`);
          this.sseSubscription.unsubscribe();
          this.sseSubscription = undefined;
        }
      });
    });

    effect(() => {
      const hasSession = this.hasActiveSession();

      const currentTable = untracked(this._tableNumber);
      const currentParticipants = untracked(this._activeParticipants);

      if (
        hasSession &&
        (currentTable === 0 || currentParticipants.length === 0)
      ) {
        console.log(
          '🔄 Detectada recarga de página con sesión activa. Restaurando datos de la mesa...'
        );

        this._isLoading.set(true);

        this.recoverActiveSession().subscribe({
          next: () => {
            this._isLoading.set(false);
          },
          error: (err) => {
            console.error('Error al auto-recuperar sesión:', err),
              this._isLoading.set(false);
          },
        });
      } else if (
        hasSession &&
        currentTable > 0 &&
        currentParticipants.length > 0
      ) {
        this._isLoading.set(false);
      }
    });
  }

  private syncNicknameFromProfile(): void {
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        const currentNickname = this._participantNickname();
        const profileName = profile.name || 'Usuario';

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

  refreshNickname(): void {
    if (this.hasActiveSession() && !this.authState.isGuest()) {
      this.syncNicknameFromProfile();
    }
  }

  updateNickname(newNickname: string): void {
    if (newNickname && newNickname.trim()) {
      console.log('✅ Actualizando nickname:', newNickname);
      this._participantNickname.set(newNickname);
      localStorage.setItem('participantNickname', newNickname);
    }
  }

  recoverActiveSession(): Observable<TableSessionResponse> {
    return this.http
      .get<TableSessionResponse>(
        `${environment.baseUrl}/participants/table-sessions`
      )
      .pipe(
        tap((response) => {
          console.log('🔄 Datos de sesión recuperados:', response);

          const myParticipantId = this.authState.participantId();
          console.log('🆔 Mi Participant ID:', myParticipantId);

          const me = response.activeParticipants?.find(
            (p) =>
              p.publicId === myParticipantId || p.publicId === myParticipantId
          );

          let nicknameToSet = '';

          if (me && me.nickname) {
            console.log('Nickname encontrado en sesión:', me.nickname);
            nicknameToSet = me.nickname;
          } else {
            console.warn(
              'No se encontro al participante en la lista. Usando fallback.'
            );
            nicknameToSet = this._participantNickname();
          }

          const count = response.numberOfParticipants ?? 1;

          const activeList = response.activeParticipants || [];
          const previousList = response.previousParticipants || [];
          const hostId = response.sessionHost?.publicId || null;

          this.setTableSessionInfo(
            response.tableNumber,
            nicknameToSet,
            count,
            response.tableCapacity || null,
            activeList,
            previousList,
            hostId
          );
        })
      );
  }

  setTableSessionInfo(
    tableNumber: number,
    participantNickname: string,
    participantCount: number,
    tableCapacity: number | null,
    activeParticipants: Participant[] = [],
    previousParticipants: Participant[] = [],
    hostParticipantId: string | null = null
  ): void {
    console.log('📝 Guardando info de mesa:', {
      tableNumber,
      participantNickname,
      participantCount,
      tableCapacity,
    });

    if (tableNumber > 0) {
      this._tableNumber.set(tableNumber);
      localStorage.setItem('tableNumber', tableNumber.toString());
    } else {
      this._tableNumber.set(0);
      localStorage.removeItem('tableNumber');
    }

    if (participantNickname && participantNickname.trim()) {
      this._participantNickname.set(participantNickname);
      localStorage.setItem('participantNickname', participantNickname);
    } else {
      this._participantNickname.set('');
      localStorage.removeItem('participantNickname');
    }

    if (participantCount >= 0) {
      this._participantCount.set(participantCount);
    } else {
      this._participantCount.set(0);
    }

    if (tableCapacity === null) {
      this._tableCapacity.set(null);
      localStorage.removeItem('tableCapacity');
    } else if (typeof tableCapacity === 'number' && tableCapacity >= 0) {
      this._tableCapacity.set(tableCapacity);
      localStorage.setItem('tableCapacity', tableCapacity.toString());
    } else {
      this._tableCapacity.set(null);
      localStorage.removeItem('tableCapacity');
    }

    this._activeParticipants.set(activeParticipants);
    this._previousParticipants.set(previousParticipants);
    this._hostParticipantId.set(hostParticipantId);

    console.log(
      '💾 Estado actual de tableSessionInfo:',
      this.tableSessionInfo()
    );
  }

  private clearAllClientState() {
    this.clearSession();
    this.authState.clearSessionData();
    this.foodVenueService.clearAll();
    this.menuService.clearCache();
  }

  clearSession(): void {
    console.log('🧹 Limpiando sesión de mesa');

    this._tableNumber.set(0);
    this._participantNickname.set('');
    this._participantCount.set(0);
    this._tableCapacity.set(null);
    this._activeParticipants.set([]);
    this._previousParticipants.set([]);

    localStorage.removeItem('tableNumber');
    localStorage.removeItem('participantNickname');
    localStorage.removeItem('tableCapacity');
  }

  //Esto podria estar en un servicio dedicado al participante actual
  closeSession(): Observable<any> {
    console.log('Cerrando sesión de mesa (End Session)...');

    return this.http
      .patch<any>(`${environment.baseUrl}/participants/end`, null, {
        observe: 'response',
      })
      .pipe(
        tap((response) => {
          if (response.status === 200) {
            const processed = TokenManager.processAuthResponse(response.body);
            this.authState.applyAuthData(processed);
          } else {
            this.authState.clearState();
          }

          this.clearAllClientState();

          console.log('Sesión cerrada exitosamente en datos locales');
        })
      );
  }

  leaveSession(): Observable<any> {
    console.log('Abandonando sesión de mesa...');

    return this.http
      .patch<any>(`${environment.baseUrl}/participants/leave`, null, {
        observe: 'response',
      })
      .pipe(
        tap((response) => {
          console.log('Respuesta leave:', response.status);

          this.clearAllClientState();
        })
      );
  }

  delegateHostingDuties(targetParticipantId: string): Observable<void> {
    console.log('👑 Delegando host a:', targetParticipantId);

    return this.http.patch<void>(
      `${environment.baseUrl}/participants/host/${targetParticipantId}`,
      {}
    );
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

  private getStoredCapacity(): number | null {
    try {
      const stored = localStorage.getItem('tableCapacity');
      if (!stored) return null;

      if (stored === 'null') return null;

      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  }
}
