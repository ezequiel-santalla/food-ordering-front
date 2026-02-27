import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Bell } from 'lucide-angular';
import { filter, finalize } from 'rxjs';
import { NotificationApiService } from '../../services/notification-api-service';
import { NotificationResponseDto } from '../../models/notification.interface';
import { AuthStateManager } from '../../../auth/services/auth-state-manager-service';
import { ServerSentEventsService } from '../../../shared/services/server-sent-events.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-dropdown.html',
})
export class NotificationDropdownComponent {
  private notificationsApi = inject(NotificationApiService);
  private authState = inject(AuthStateManager);
  private router = inject(Router);
  private sse = inject(ServerSentEventsService);
  private destroyRef = inject(DestroyRef);

  readonly Bell = Bell;

  isAuthenticated = this.authState.isAuthenticated;

  unreadCount = signal<number>(0);
  notifications = signal<NotificationResponseDto[]>([]);
  isLoadingNotifications = signal<boolean>(false);

  private loadedOnce = false;

  constructor() {
      console.log('[NotificationDropdown] mounted');
    effect(() => {
      if (this.isAuthenticated()) {
        this.refreshUnreadCount();
        this.bindSse();
      } else {
        this.unreadCount.set(0);
        this.notifications.set([]);
        this.loadedOnce = false;
      }
    });
  }

  onOpenNotifications() {

     console.log('[NotificationDropdown] click', {
    isAuth: this.isAuthenticated(),
  });
    if (!this.isAuthenticated()) return;

    this.refreshUnreadCount();
    
      this.loadNotifications();
    if (!this.loadedOnce) {
      this.loadNotifications();
      this.loadedOnce = true;
    }
  }

  private refreshUnreadCount() {
    this.notificationsApi.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(Number(res.unreadCount ?? 0)),
      error: () => this.unreadCount.set(0),
    });
  }

  private loadNotifications() {
    this.isLoadingNotifications.set(true);
console.log('loading notifications...');
    this.notificationsApi
      .getMyNotifications({ page: 0, size: 10 })
      .pipe(finalize(() => this.isLoadingNotifications.set(false)))
      .subscribe({
        next: (page) => this.notifications.set(page.content ?? []),
        error: () => this.notifications.set([]),
      });
  }

  openNotification(n: NotificationResponseDto, ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();

    if (n.unread) {
      this.notificationsApi.markAsRead(n.publicId).subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.map((x) =>
              x.publicId === n.publicId ? { ...x, unread: false } : x,
            ),
          );
          this.unreadCount.update((c) => Math.max(0, c - 1));
        },
        error: () => {},
      });
    }

    if (n.linkUrl) {
      // si linkUrl es ruta interna
      this.router.navigateByUrl(n.linkUrl);
    }
  }

  markAllAsRead(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();

    this.notificationsApi.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((x) => ({ ...x, unread: false })),
        );
        this.unreadCount.set(0);
      },
      error: () => {},
    });
  }

  goToNotificationsPage(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    this.router.navigateByUrl('/notifications');
  }

  formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  private bindSse() {
    this.sse
      .subscribeToUser()
      .pipe(
        filter((e) => e?.type === 'new_notification'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        const n = e.payload as NotificationResponseDto;

        this.notifications.update((list) => [n, ...list].slice(0, 10));

        this.unreadCount.update((c) => c + 1);
      });
  }
}
