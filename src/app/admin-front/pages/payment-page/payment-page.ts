import { Component, computed, effect, inject, signal } from '@angular/core';
import { PaymentPageResponse, PaymentResponse, PaymentStatus } from '../../models/payments';
import { PaymentService } from '../../services/payment-service';

import { AlertCircle, CheckCircle2, CreditCard, DollarSign, LucideAngularModule, RefreshCw, Search, XCircle } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentCard } from "../../components/payments/payment-card/payment-card";
import { PaginationComponent } from "../../../shared/components/pagination/pagination.component";
import { PaginationService } from '../../../shared/components/pagination/pagination.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
}

@Component({
  selector: 'app-payment-page',
  imports: [LucideAngularModule, CommonModule, FormsModule, PaymentCard, PaginationComponent],
  templateUrl: './payment-page.html',
  styleUrl: './payment-page.css'
})
export class PaymentPage {
  // Services
  paymentService = inject(PaymentService);
  paginationService = inject(PaginationService);
  sweetAlertService = inject(SweetAlertService);

  // Icons
  readonly DollarSign = DollarSign;
  readonly CheckCircle2 = CheckCircle2;
  readonly CreditCard = CreditCard;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly AlertCircle = AlertCircle;

  // Data
  payments = signal<PaymentResponse[]>([]);
  filteredPayments: PaymentResponse[] = [];
  totalPages = 1;

  // Filters
  searchTerm = '';
  selectedStatus = '';

  // State
  isLoading = false;
  error: string | null = null;

  // Stats
  stats = computed<PaymentStats>(() => {
    const totalAmount = this.payments().reduce((sum, p) => sum + p.amount, 0);
    const completedAmount = this.payments()
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingCount = this.payments().filter(p => p.status === 'PENDING').length;

    return {
      total: totalAmount,
      completed: completedAmount,
      pending: pendingCount
    };
  });

  constructor() {
    effect(() => {
      const page = this.paginationService.currentPage();
      this.loadPayments(page);
    });
  }

   ngOnInit(): void {
     this.loadPayments();
   }


  loadPayments(page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    this.paymentService.getTodayPayments(undefined, page - 1, 15).subscribe({
      next: (data: PaymentPageResponse) => {
        this.payments.set(data.content);
        this.totalPages = data.totalPages;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.error = 'Error al cargar los pagos. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  refreshPayments(): void {
    const page = this.paginationService.currentPage();
    this.loadPayments(page);
  }

  // ===================================
  // Filtering & Search
  // ===================================

  applyFilters(): void {
    let filtered = [...this.payments()];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.publicId.toLowerCase().includes(term) ||
        payment.paymentMethod.toLowerCase().includes(term)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(payment => payment.status === this.selectedStatus);
    }

    filtered.sort((a, b) => b.publicId.localeCompare(a.publicId));

    this.filteredPayments = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // ===================================
  // Payment Actions
  // ===================================

  onPaymentStatusChanged(event: { paymentId: string; newStatus: PaymentStatus }): void {
    const confirmMessage = event.newStatus === 'COMPLETED'
      ? '¿Confirmar que el pago ha sido completado?'
      : '¿Estás seguro de cancelar este pago?';

    if (!confirm(confirmMessage)) {
      return;
    }

    const action$ = event.newStatus === 'COMPLETED'
      ? this.paymentService.completePayment(event.paymentId)
      : this.paymentService.cancelPayment(event.paymentId);

    action$.subscribe({
      next: () => {
        this.refreshPayments();
      },
      error: (err) => {
        console.error('Error updating payment status:', err);
        this.error = 'Error al actualizar el estado del pago.';
      }
    });
  }

  onViewPaymentDetails(paymentId: string): void {
    console.log('View payment details:', paymentId);
  }
}
