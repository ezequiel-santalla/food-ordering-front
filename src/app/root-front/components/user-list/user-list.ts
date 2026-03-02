import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, take } from 'rxjs';
import {
  LucideAngularModule,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  UserCheck,
} from 'lucide-angular';

import { RootUserService } from '../../services/root-user.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { UserDetailResponseDto } from '../../../shared/models/user';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './user-list.html',
})
export class UserListComponent implements OnInit {
  private rootUserService = inject(RootUserService);
  private swalService = inject(SweetAlertService);
  private usersMaster = signal<UserDetailResponseDto[]>([]);
  searchTerm = signal('');

  protected readonly Search = Search;
  protected readonly Mail = Mail;
  protected readonly Phone = Phone;
  protected readonly MapPin = MapPin;
  protected readonly Calendar = Calendar;
  protected readonly Hash = Hash;
  protected readonly Trash2 = Trash2;
  protected readonly X = X;
  protected readonly ChevronRight = ChevronRight;
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly UserCheck = UserCheck;

  public users = signal<UserDetailResponseDto[]>([]);
  public isLoading = signal(false);
  public showDeleted = signal(false);
  public selectedUser = signal<UserDetailResponseDto | null>(null);
  public isModalOpen = signal(false);

  public currentPage = signal(0);
  public totalPages = signal(0);
  public totalElements = signal(0);
  public isFirst = signal(true);
  public isLast = signal(false);

  searchControl = new FormControl('');

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((val) => {
        this.searchTerm.set(val || '');
        this.currentPage.set(0);
        this.fetchUsers();
      });

    this.fetchUsers();
  }

  public filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const master = this.usersMaster();
    if (!term || term.length < 3) return master;

    return master.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term),
    );
  });

  getPaginationRange(): (number | string)[] {
    const current = this.currentPage() + 1;
    const total = this.totalPages();
    const range: (number | string)[] = [];

    if (total <= 1) return [1];

    const pages = new Set<number>([1, total]);

    for (
      let i = Math.max(1, current - 2);
      i <= Math.min(total, current + 2);
      i++
    ) {
      pages.add(i);
    }

    for (let i = 10; i < total; i += 10) {
      pages.add(i);
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);

    sortedPages.forEach((page, idx) => {
      if (idx > 0 && page !== sortedPages[idx - 1] + 1) {
        range.push('...');
      }
      range.push(page);
    });

    return range;
  }

  fetchUsers() {
    this.isLoading.set(true);

    const page = this.currentPage();
    const term = this.searchTerm().trim();

    const searchParam = term.length >= 3 ? term : '';

    const request$ = this.showDeleted()
      ? this.rootUserService.getDeleted(searchParam, page, 10)
      : this.rootUserService.getAll(searchParam, page, 10);

    request$.subscribe({
      next: (res) => {
        this.usersMaster.set(res.content || []);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.isFirst.set(res.first);
        this.isLast.set(res.last);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.usersMaster.set([]);
      },
    });
  }

  toggleDeleted() {
    this.showDeleted.update((val) => !val);
    this.currentPage.set(0);
    this.searchControl.setValue('');
    this.fetchUsers();
  }

  onPageClick(p: number | string): void {
    if (p === '...') return;

    const pageIndex = Number(p) - 1;
    this.goToPage(pageIndex);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.fetchUsers();
    }
  }

  openDetails(user: UserDetailResponseDto): void {
    this.selectedUser.set({ ...user });
    this.isModalOpen.set(true);

    console.log('Usuario seleccionado para el modal:', this.selectedUser());
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    setTimeout(() => {
      this.selectedUser.set(null);
    }, 300);
  }

  confirmDelete(id: string, name: string): void {
    this.swalService
      .confirm(
        '¿Eliminar usuario?',
        `Estás por eliminar a ${name}. Esta acción es reversible.`,
        'Eliminar',
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.swalService.showLoading('Eliminando...', 'Por favor, espera.');

          this.rootUserService.deleteUser(id).subscribe({
            next: () => {
              this.swalService.showSuccess(
                'Eliminado',
                'Usuario desactivado correctamente.',
              );
              this.fetchUsers();
            },
            error: () =>
              this.swalService.showError(
                'Error',
                'No se pudo eliminar el usuario.',
              ),
          });
        }
      });
  }

  restoreUser(id: string) {
    this.swalService
      .confirm(
        '¿Restaurar usuario?',
        'El usuario volverá a la lista de activos.',
        'Restaurar',
      )
      .then((res) => {
        if (res.isConfirmed) {
          this.swalService.showLoading(
            'Restaurando...',
            'Reactivando cuenta de usuario.',
          );

          this.rootUserService
            .patchUser(id, { deleted: false } as any)
            .subscribe({
              next: () => {
                this.swalService.showSuccess(
                  'Éxito',
                  'Usuario restaurado correctamente',
                );
                this.closeModal();
                this.fetchUsers();
              },
              error: () =>
                this.swalService.showError(
                  'Error',
                  'No se pudo completar la restauración.',
                ),
            });
        }
      });
  }
}
