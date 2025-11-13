import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertCircle, CheckCircle2, ChefHat, Clock, List, LucideAngularModule, Package, RefreshCw, Search } from 'lucide-angular';
import { OrderCard } from '../../components/orders/order-card/order-card';
import { OrderDetail } from '../../components/orders/order-detail/order-detail';
import { OrderResponse, OrderStatus } from '../../models/order';
import { OrderService } from '../../services/order-service';


type OrderView = 'pending' | 'inProgress' | 'all';

interface OrderStats {
  total: number;
  pending: number;
  inPreparation: number;
  completed: number;
}

@Component({
  selector: 'app-order-page',
  imports: [CommonModule, LucideAngularModule, FormsModule, OrderCard, OrderDetail],
  templateUrl: './order-page.html',
  styleUrl: './order-page.css'
})
export class OrderPage {
// Icons
  readonly Package = Package;
  readonly Clock = Clock;
  readonly ChefHat = ChefHat;
  readonly CheckCircle2 = CheckCircle2;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly AlertCircle = AlertCircle;
  readonly List = List;

  // Data
  orders = signal<OrderResponse[]>([]);
  filteredOrders = signal<OrderResponse[]>([]);
  selectedOrder = signal<OrderResponse | null>(null);

  // Filters
  searchTerm = '';
  selectedStatus = '';
  activeView = signal<OrderView>('pending');

  // Pagination
  currentPage = signal(0);
  pageSize = 15;
  totalPages = signal(0);

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Auto-refresh
  private refreshInterval?: number;

  // Stats
  stats = computed<OrderStats>(() => {
    const allOrders = this.orders();
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'PENDING').length,
      inPreparation: allOrders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'APPROVED').length,
      completed: allOrders.filter(o => o.status === 'COMPLETED' || o.status === 'SERVED').length
    };
  });

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  //  this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  // ===================================
  // Data Loading
  // ===================================

  loadOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Cargar órdenes del día con paginación
    this.orderService.getTodayOrders(undefined, 0, 500).subscribe({
      next: (response) => {
        this.orders.set(response.content || []);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error.set('Error al cargar los pedidos. Por favor, intenta nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  startAutoRefresh(): void {
    // Actualizar cada 15 segundos para pedidos activos
    this.refreshInterval = window.setInterval(() => {
      this.loadOrders();
    }, 15000);
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ===================================
  // Filtering & Search
  // ===================================

  applyFilters(): void {
    let filtered = [...this.orders()];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.clientAlias.toLowerCase().includes(term) ||
        order.orderDetails.some(detail =>
          detail.productName.toLowerCase().includes(term)
        )
      );
    }

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    this.filteredOrders.set(filtered);
    this.calculatePagination();
  }

  onSearchChange(): void {
    this.currentPage.set(0);
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.applyFilters();
  }

  // ===================================
  // View Management
  // ===================================

  setActiveView(view: OrderView): void {
    this.activeView.set(view);
    this.currentPage.set(0);
  }

  getDisplayedOrders(): OrderResponse[] {
    let orders = this.filteredOrders();

    // Filter by active view
    if (this.activeView() === 'pending') {
      orders = orders.filter(o => o.status === 'PENDING');
    } else if (this.activeView() === 'inProgress') {
      orders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'APPROVED');
    }

    orders = [...orders].sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA;
    });

    // Pagination
    const start = this.currentPage() * this.pageSize;
    const end = start + this.pageSize;
    return orders.slice(start, end);
  }

  getPendingCount(): number {
    return this.filteredOrders().filter(o => o.status === 'PENDING').length;
  }

  getInProgressCount(): number {
    return this.filteredOrders().filter(o =>
      o.status === 'IN_PROGRESS' || o.status === 'APPROVED'
    ).length;
  }

  // ===================================
  // Pagination
  // ===================================

  calculatePagination(): void {
    let orders = this.filteredOrders();

    if (this.activeView() === 'pending') {
      orders = orders.filter(o => o.status === 'PENDING');
    } else if (this.activeView() === 'inProgress') {
      orders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'APPROVED');
    }

    this.totalPages.set(Math.ceil(orders.length / this.pageSize));
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Show max 5 page numbers
    let start = Math.max(0, current - 2);
    let end = Math.min(total, start + 5);

    if (end - start < 5) {
      start = Math.max(0, end - 5);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // ===================================
  // Order Actions
  // ===================================

  onOrderStatusChanged(event: { orderId: string; newStatus: OrderStatus }): void {
    this.orderService.updateOrderStatus(event.orderId, event.newStatus).subscribe({
      next: () => {
        // Update local order
        const orderIndex = this.orders().findIndex(o => o.publicId === event.orderId);
        if (orderIndex !== -1) {
          const updatedOrders = [...this.orders()];
          updatedOrders[orderIndex] = {
            ...updatedOrders[orderIndex],
            status: event.newStatus
          };
          this.orders.set(updatedOrders);
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.error.set('Error al actualizar el estado del pedido.');
      }
    });
  }

  onViewOrderDetails(orderId: string): void {
    const order = this.orders().find(o => o.publicId === orderId);
    if (order) {
      this.selectedOrder.set(order);
    }
  }

  closeOrderModal(): void {
    this.selectedOrder.set(null);
  }
}
