import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Armchair, LucideAngularModule, RefreshCw } from 'lucide-angular';
import { DiningTableStatus, TablePositionResponse } from '../../../admin-front/models/lounge';
import { OrderResponse, OrderStatus } from '../../models/orders';
import { LoungeService } from '../../../admin-front/services/lounge-service';
import { OrderService } from '../../services/order-service';
import { TableDetailModal } from '../../components/table-detail-modal/table-detail-modal';

interface ScaledTable extends TablePositionResponse {
  displayX: number;
  displayY: number;
  displayWidth: number;
  displayHeight: number;
}

@Component({
  selector: 'app-lounge-page',
  imports: [CommonModule,
    FormsModule,
    LucideAngularModule,
    TableDetailModal],
  templateUrl: './lounge-page.html',
  styleUrl: './lounge-page.css'
})
export class LoungePage {
  readonly RefreshCw = RefreshCw;
  readonly Armchair = Armchair;

  // Viewport dimensions
  virtualGridWidth = 1600;
  virtualGridHeight = 800;
  viewportWidth = 0;
  viewportHeight = 0;
  scaleRatio = 1;

  // Data
  currentSector: string = 'Principal';
  sectors: string[] = [];

  tablePositions: TablePositionResponse[] = [];
  orders: OrderResponse[] = [];

  // Selected table
  selectedTable = signal<TablePositionResponse | null>(null);

  // Loading state
  isLoading = signal(false);

  // Auto-refresh
  private refreshInterval?: number;

  constructor(
    private loungeService: LoungeService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.initializeLounge();
    this.calculateViewportDimensions();
    this.startAutoRefresh();

    window.addEventListener('resize', () => this.calculateViewportDimensions());
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    window.removeEventListener('resize', () => this.calculateViewportDimensions());
  }

  // ===================================
  // Data Loading
  // ===================================

  loadSectors(): void {
    this.loungeService.getSectors().subscribe({
      next: (response) => {
        this.sectors = response.sectors;

        // Si hay sectores, usar el primero como default
        if (this.sectors.length > 0) {
          this.currentSector = this.sectors[0];
        } else {
          // Si no hay sectores, usar default y agregarlo
          this.currentSector = 'Planta Baja';
          this.sectors = ['Planta Baja'];
        }
      },
      error: (err) => {
        console.error('Error loading sectors:', err);
        // Fallback a sectores por defecto
        this.sectors = ['Planta Baja'];
        this.currentSector = 'Planta Baja';
      }
    });
  }

  initializeLounge(): void {
    this.isLoading.set(true);

    this.loungeService.getLounge().subscribe({
      next: () => {
        this.loadTablePositions();
        this.loadSectors();
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error initializing lounge:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadTablePositions(): void {
    this.loungeService.getTablePositions().subscribe({
      next: (positions) => {
        this.tablePositions = positions;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading table positions:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadOrders(): void {
    // Cargar todas las órdenes del día
    this.orderService.getTodayOrders(undefined, 0, 500).subscribe({
      next: (response) => {
        this.orders = response.content || [];
      },
      error: (err) => console.error('Error loading orders:', err)
    });
  }

  refreshLounge(): void {
    this.loadTablePositions();
    this.loadOrders();
  }

  startAutoRefresh(): void {
    // Actualizar cada 30 segundos
    this.refreshInterval = window.setInterval(() => {
      this.refreshLounge();
    }, 30000);
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ===================================
  // Viewport Calculations
  // ===================================

  calculateViewportDimensions(): void {
    const containerElement = document.querySelector('.p-4.sm\\:p-8');
    if (!containerElement) return;

    const availableWidth = containerElement.clientWidth - 64;
    const availableHeight = window.innerHeight -250;

    const scaleX = availableWidth / this.virtualGridWidth;
    const scaleY = availableHeight / this.virtualGridHeight;

    this.scaleRatio = Math.min(scaleX, scaleY, 1);
    this.viewportWidth = this.virtualGridWidth * this.scaleRatio;
    this.viewportHeight = this.virtualGridHeight * this.scaleRatio;
  }

  // ===================================
  // Table Filtering & Stats
  // ===================================

  get tablesInCurrentSector(): TablePositionResponse[] {
    return this.tablePositions.filter(t => t.sector === this.currentSector);
  }

  get scaledTablesInCurrentSector(): ScaledTable[] {
    return this.tablesInCurrentSector.map(table => ({
      ...table,
      displayX: table.positionX * this.scaleRatio,
      displayY: table.positionY * this.scaleRatio,
      displayWidth: (table.width || 80) * this.scaleRatio,
      displayHeight: (table.height || 80) * this.scaleRatio
    }));
  }

  getTotalCapacity(): number {
    return this.tablesInCurrentSector.reduce(
      (sum, table) => sum + (table.diningTableCapacity || 0),
      0
    );
  }

  getOccupiedCount(): number {
    return this.tablesInCurrentSector.filter(
      t => t.diningTableStatus === 'IN_SESSION' ||
           t.diningTableStatus === 'COMPLETE' ||
           t.diningTableStatus === 'WAITING_RESET'
    ).length;
  }

  getTableOrders(tableId: string): OrderResponse[] {
    // En tu backend, necesitas obtener las órdenes por tabla via table-session
    // Por ahora, filtramos localmente si tienes el dato
    // Idealmente deberías hacer una llamada al endpoint de table-session
    return this.orders.filter(order =>
      // Como no tienes tableId directamente en Order, necesitas la sessionId
      // Esto es una limitación temporal - idealmente usarías getOrdersByTableSession
      order.participantId === tableId // TEMPORAL - ajustar según necesidad
    );
  }

  getPendingOrdersCount(tableId: string): number {
    return this.getTableOrders(tableId).filter(
      order => order.status === 'PENDING'
    ).length;
  }

  onOrderStatusChanged(event: { orderId: string; newStatus: OrderStatus}): void {
    this.orderService.updateOrderStatus(event.orderId, event.newStatus).subscribe({
      next: () => {
        this.loadOrders();
        // Actualizar la orden en el array local
        const orderIndex = this.orders.findIndex(o => o.publicId === event.orderId);
        if (orderIndex !== -1) {
          this.orders[orderIndex] = { ...this.orders[orderIndex], status: event.newStatus };
        }
      },
      error: (err) => console.error('Error updating order status:', err)
    });
  }

  // ===================================
  // Table Management
  // ===================================

  selectTable(table: TablePositionResponse): void {
    this.selectedTable.set(table);
  }

  closeTableModal(): void {
    this.selectedTable.set(null);
  }

  onSectorChange(): void {
    // Podrías agregar lógica adicional al cambiar de sector
  }

  onTableStatusChanged(event: { tableId: string; newStatus: DiningTableStatus }): void {
    // Actualizar el estado de la mesa
    const tableIndex = this.tablePositions.findIndex(
      t => t.diningTableId === event.tableId
    );

    if (tableIndex !== -1) {
      this.tablePositions[tableIndex] = {
        ...this.tablePositions[tableIndex],
        diningTableStatus: event.newStatus
      };
    }

    this.closeTableModal();
  }
}
