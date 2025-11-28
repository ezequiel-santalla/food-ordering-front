import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { TablePosition, TablePositionResponse, DiningTableStatus, LoungeResponse } from '../../../models/lounge';
import { OrderResponse, OrderStatus } from '../../../models/order';

import { LoungeService } from '../../../services/lounge-service';
import { OrderService } from '../../../services/order-service';
import { TableSessionService } from '../../../services/table-session-service';
import { DiningTableService } from '../../../services/dining-table-service';
import { TableCreateModal } from '../../../components/dining-table/table-create-modal/table-create-modal';
import { SectorModal } from '../../../components/sector-modal/sector-modal';
import { TableEditDetailModal } from '../../../components/dining-table/table-edit-detail-modal/table-edit-detail-modal';
import { TableDetailModal } from '../../../components/dining-table/table-detail-modal/table-detail-modal';
import { catchError, of, switchMap, tap } from 'rxjs';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-lounge-builder-page',
  imports: [TableCreateModal, SectorModal, FormsModule, CommonModule, TableEditDetailModal, TableDetailModal],
  templateUrl: './lounge-builder-page.html',
  styleUrl: './lounge-builder-page.css'
})
export class LoungeBuilderPage implements OnInit, OnDestroy {

  virtualGridWidth = 1800;
  virtualGridHeight = 800;
  gridStep = 25;
  collisionBuffer = 5;
  viewportWidth = 0;
  viewportHeight = 0;
  scaleRatio = 1;

  currentSector: string = '';
  sectors: string[] = [];
  tablePositions: TablePositionResponse[] = [];
  selectedTable: TablePositionResponse | null = null;
  allOrders: OrderResponse[] = [];
  selectedTableOrders: OrderResponse[] = [];

  hasUnsavedChanges: boolean = false;
  isEditingMode: boolean = false;
  isLoading: boolean = true;
  isMobileView = false;

  gridWidth = 1200;
  gridHeight = 800;
  showSectorModal = false;
  showTableModal = false;
  draggedTable: TablePositionResponse | null = null;

  constructor(
    private loungeService: LoungeService,
    private orderService: OrderService,
    private tableSessionService: TableSessionService,
    private diningTableService: DiningTableService,
    private sweetAlertService: SweetAlertService
  ) { }

  ngOnInit(): void {
    this.initializeLounge();
    this.calculateViewportDimensions();
    this.checkIfMobile();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.calculateViewportDimensions();
    this.checkIfMobile();
  };

  private checkIfMobile(): void {
  this.isMobileView = window.innerWidth < 768; // Tailwind 'md' breakpoint
}
  // =======================================================
  // UTILS Y GETTERS
  // =======================================================

  get tablesInCurrentSector(): TablePositionResponse[] {
    return this.tablePositions.filter(t => t.sector === this.currentSector);
  }

  get scaledTablesInCurrentSector() {
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
      (sum, table) => sum + (table.diningTableCapacity || 0), 0
    );
  }

  getTableNumberFontSize(scale: number): string {
    const size = Math.max(12, 30 * scale);
    return `${size}px`;
  }

  getTableCapacityFontSize(scale: number): string {
    const size = Math.max(8, 16 * scale);
    return `${size}px`;
  }

  private updateTablePositionLocal(tableId: string, updates: Partial<TablePositionResponse>): void {
    const index = this.tablePositions.findIndex(t => t.diningTableId === tableId);
    if (index !== -1) {
      this.tablePositions[index] = { ...this.tablePositions[index], ...updates };
      this.hasUnsavedChanges = true;
    }
  }

  // =======================================================
  // MANEJO DE VISTA Y DRAG & DROP
  // =======================================================

  calculateViewportDimensions(): void {
    setTimeout(() => {
      const containerElement = document.querySelector('.lounge-container');

      if (!containerElement) return;

      const viewportWidth = document.documentElement.clientWidth;

      const sidebarWidth = 200;
      const headerHeight = 200;
      const legendHeight = 80;
      const horizontalPadding = 80;

      const availableWidth = Math.max(
        viewportWidth - sidebarWidth - horizontalPadding,
        400
      );

      const availableHeight = Math.max(
        window.innerHeight - headerHeight - legendHeight,
        300
      );

      const scaleX = availableWidth / this.virtualGridWidth;
      const scaleY = availableHeight / this.virtualGridHeight;

      this.scaleRatio = Math.min(scaleX, scaleY, 1);
      this.viewportWidth = Math.floor(this.virtualGridWidth * this.scaleRatio);
      this.viewportHeight = Math.floor(this.virtualGridHeight * this.scaleRatio);
    }, 100);
  }

  toVirtualCoords(viewportX: number, viewportY: number): { x: number, y: number } {
    const rawVirtualX = viewportX / this.scaleRatio;
    const rawVirtualY = viewportY / this.scaleRatio;
    return {
      x: Math.round(rawVirtualX / this.gridStep) * this.gridStep,
      y: Math.round(rawVirtualY / this.gridStep) * this.gridStep
    };
  }

  onDragStart(event: DragEvent, table: TablePositionResponse): void {
    if (!this.isEditingMode) {
      event.preventDefault();
      return;
    }
    this.draggedTable = table;

    // 👇 Crear ghost image personalizada
  const dragImage = document.createElement('div');
  dragImage.style.width = `${(table.width || 80) * this.scaleRatio}px`;
  dragImage.style.height = `${(table.height || 80) * this.scaleRatio}px`;
  dragImage.style.backgroundColor = 'rgba(59, 130, 246, 0.5)';
  dragImage.style.border = '2px dashed #3b82f6';
  dragImage.style.borderRadius = table.tableShape === 'round' ? '50%' : '8px';
  dragImage.style.display = 'flex';
  dragImage.style.alignItems = 'center';
  dragImage.style.justifyContent = 'center';
  dragImage.style.color = 'white';
  dragImage.style.fontWeight = 'bold';
  dragImage.innerHTML = `${table.diningTableNumber}`;

  document.body.appendChild(dragImage);
  event.dataTransfer!.setDragImage(dragImage,
    ((table.width || 80) * this.scaleRatio) / 2,
    ((table.height || 80) * this.scaleRatio) / 2
  );

  // Limpiar después
  setTimeout(() => document.body.removeChild(dragImage), 0);


    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', table.diningTableId);
  }

  onDragOver(event: DragEvent): void {
    if (!this.isEditingMode) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent): void {
    if (!this.isEditingMode) return;
    event.preventDefault();
    if (!this.draggedTable) return;

    const tableWidth = (this.draggedTable.width || 80) * this.scaleRatio;
    const tableHeight = (this.draggedTable.height || 80) * this.scaleRatio;

    const dropX = event.offsetX;
    const dropY = event.offsetY;

    const viewportX = Math.max(0, Math.min(
      dropX - tableWidth / 2,
      this.viewportWidth - tableWidth
    ));

    const viewportY = Math.max(0, Math.min(
      dropY - tableHeight / 2,
      this.viewportHeight - tableHeight
    ));

    const virtualCoords = this.toVirtualCoords(viewportX, viewportY);

    if (this.detectCollision(
      virtualCoords.x,
      virtualCoords.y,
      this.draggedTable.width || 80,
      this.draggedTable.height || 80,
      this.draggedTable.diningTableId
    )) {
      this.sweetAlertService.showInfo(
        'Posición no disponible',
        'No puedes colocar una mesa encima de otra.'
      );
      this.draggedTable = null;
      return;
    }

    this.updateTablePositionLocal(this.draggedTable.diningTableId, {
      positionX: virtualCoords.x,
      positionY: virtualCoords.y,
    });
    this.draggedTable = null;
  }

  private detectCollision(
    virtualX: number,
    virtualY: number,
    width: number,
    height: number,
    excludeTableId: string
  ): boolean {
    return this.tablesInCurrentSector.some(table => {
      if (table.diningTableId === excludeTableId) return false;
      const tableWidth = table.width || 80;
      const tableHeight = table.height || 80;

      const overlapXBuffer = virtualX < table.positionX + tableWidth - this.collisionBuffer &&
        virtualX + width - this.collisionBuffer > table.positionX;
      const overlapYBuffer = virtualY < table.positionY + tableHeight - this.collisionBuffer &&
        virtualY + height - this.collisionBuffer > table.positionY;
      return overlapXBuffer && overlapYBuffer;
    });
  }

  // =======================================================
  // LÓGICA DE CARGA DE DATOS
  // =======================================================

  initializeLounge(): void {
    this.loungeService.getLounge().subscribe({
      next: (lounge: LoungeResponse) => {
        this.gridWidth = lounge.gridWidth;
        this.gridHeight = lounge.gridHeight;
        this.loadSectors();
        this.loadTablePositions();
      },
      error: (err) => {
        console.error('Error initializing lounge:', err);
        this.isLoading = false;
        this.sweetAlertService.showError(
          'Error al cargar el salón',
          'No se pudo inicializar el salón. Por favor, intenta nuevamente.'
        );
      }
    });
  }

  loadTablePositions(): void {
    this.loungeService.getTablePositions().subscribe({
      next: (positions: TablePositionResponse[]) => {
        this.tablePositions = positions;
        this.hasUnsavedChanges = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading table positions:', err);
        this.isLoading = false;
        this.sweetAlertService.showError(
          'Error al cargar mesas',
          'No se pudieron cargar las posiciones de las mesas.'
        );
      }
    });
  }

  loadSectors(): void {
    this.loungeService.getSectors().subscribe({
      next: (response) => {
        this.sectors = response.sectors;
        if (this.sectors.length > 0) {
          this.currentSector = this.sectors[0];
        } else {
          this.currentSector = 'Planta Baja';
          this.sectors = ['Planta Baja'];
        }
      },
      error: (err) => {
        console.error('Error loading sectors:', err);
        this.sweetAlertService.showError(
          'Error al cargar sectores',
          'No se pudieron cargar los sectores del salón.'
        );
      }
    });
  }

  // =======================================================
  // LÓGICA DE SESIÓN Y ÓRDENES (MODO SERVICIO)
  // =======================================================
  loadTableSessionAndOrders(table: TablePositionResponse): void {
    this.selectedTableOrders = [];

    if (table.diningTableStatus !== 'IN_SESSION') {
      return;
    }

    this.tableSessionService.getLatestSessionByTableId(table.diningTableId).pipe(
      switchMap(sessionResponse => {
        const sessionId = sessionResponse.publicId;
        console.log(`Cargando pedidos para sesión: ${sessionId}`);
        return this.tableSessionService.getOrdersByTableSession(sessionId, undefined, 0, 100);
      }),
      tap(orderPage => {
        this.selectedTableOrders = orderPage.content || [];
      }),
      catchError(err => {
        console.warn('No hay sesión activa para la mesa o error de carga de pedidos:', err);
        this.selectedTableOrders = [];
        return of(null);
      })
    ).subscribe();
  }

  async endSession(): Promise<void> {
    const tableId = this.selectedTable?.diningTableId;
    if (!tableId) return;

    const confirmed = await this.sweetAlertService.confirmCustomAction(
      '¿Finalizar sesión?',
      'La sesión de esta mesa será finalizada. ¿Deseas continuar?',
      'Sí, finalizar',
      'Cancelar',
      'question'
    );

    if (!confirmed) return;

    this.tableSessionService.endSession(tableId).subscribe({
      next: () => {
        this.sweetAlertService.showSuccess(
          'Sesión finalizada',
          'La sesión ha sido finalizada correctamente.'
        );
        this.closeTableDetailModal();
        this.loadTablePositions();
      },
      error: (err) => {
        console.error('Error al finalizar la sesión:', err);
        this.sweetAlertService.showError(
          'Error al finalizar sesión',
          'No se pudo finalizar la sesión. Por favor, intenta nuevamente.'
        );
      }
    });
  }

  async toggleEditingMode(): Promise<void> {
    if (this.isEditingMode && this.hasUnsavedChanges) {
      const confirmed = await this.sweetAlertService.confirmCustomAction(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir del modo edición y descartarlos?',
        'Sí, descartar',
        'Cancelar',
        'warning'
      );

      if (!confirmed) return;
      this.loadTablePositions();
    }
    this.isEditingMode = !this.isEditingMode;
    this.closeTableDetailModal();

    // Recalcular dimensiones después del cambio de modo
    this.calculateViewportDimensions();
  }

  selectTable(table: TablePositionResponse): void {
    this.selectedTable = table;

    if (!this.isEditingMode) {
      this.loadTableSessionAndOrders(table);
    }
  }

  closeTableDetailModal(): void {
    this.selectedTable = null;
    this.selectedTableOrders = [];
  }

  openSectorModal(): void { this.showSectorModal = true; }
  closeSectorModal(): void { this.showSectorModal = false; }

  openTableModal(): void { this.showTableModal = true; }
  closeTableModal(): void { this.showTableModal = false; }

  saveLoungeChanges(): void {
    if (!this.isEditingMode || !this.hasUnsavedChanges) return;

    const positionsToSave: TablePosition[] = this.tablePositions.map(t => ({
      diningTableId: t.diningTableId,
      positionX: t.positionX,
      positionY: t.positionY,
      sector: t.sector,
      tableShape: t.tableShape,
      width: t.width,
      height: t.height
    }));

    this.loungeService.saveAllTablePositions(positionsToSave).subscribe({
      next: (persistedPositions: TablePositionResponse[]) => {
        this.tablePositions = persistedPositions;
        this.hasUnsavedChanges = false;
        this.sweetAlertService.showSuccess(
          'Salón guardado',
          'Los cambios del salón se guardaron correctamente.'
        );
      },
      error: (err) => {
        console.error('Error al guardar el salón:', err);
        this.sweetAlertService.showError(
          'Error al guardar',
          'No se pudieron guardar los cambios del salón. Por favor, intenta nuevamente.'
        );
      }
    });
  }

  onSectorCreated(sectorName: string): void {
    if (!this.sectors.includes(sectorName)) {
      this.sectors.push(sectorName);
    }
    this.currentSector = sectorName;
    this.hasUnsavedChanges = true;
    this.closeSectorModal();
  }

  onTableCreated(tableData: any): void {
    const tablePosition: TablePosition = {
      diningTableId: tableData.diningTableId,
      positionX: 100,
      positionY: 100,
      sector: this.currentSector,
      tableShape: tableData.shape,
      width: tableData.shape === 'rect' ? 200 : 80,
      height: 80
    };

    this.loungeService.addTablePosition(tablePosition).subscribe({
      next: (newPosition) => {
        this.tablePositions.push(newPosition);
        this.hasUnsavedChanges = true;
        this.closeTableModal();
        this.sweetAlertService.showSuccess(
          'Mesa agregada',
          'La mesa se agregó correctamente al salón.'
        );
      },
      error: (err) => {
        console.error('Error adding table:', err);
        this.sweetAlertService.showError(
          'Error al agregar mesa',
          'No se pudo agregar la mesa al salón.'
        );
      }
    });
  }

  handleTableDataUpdate(updatedTable: TablePositionResponse): void {
    this.updateTablePositionLocal(updatedTable.diningTableId, updatedTable);
    this.selectedTable = null;
  }

  onTableSizeChanged(data: { tableId: string, width: number, height: number }): void {
    const table = this.tablePositions.find(t => t.diningTableId === data.tableId);
    if (!table) return;
    this.updateTablePositionLocal(data.tableId, {
      width: data.width,
      height: data.height
    });
  }

  onTableRemoved(tableId: string): void {
    this.loungeService.removeTablePosition(tableId).subscribe({
      next: () => {
        this.tablePositions = this.tablePositions.filter(t => t.diningTableId !== tableId);
        this.hasUnsavedChanges = true;
        this.closeTableDetailModal();
        this.sweetAlertService.showSuccess(
          'Mesa removida',
          'La mesa se removió correctamente del salón.'
        );
      },
      error: (err) => {
        console.error('Error removing table:', err);
        this.sweetAlertService.showError(
          'Error al remover mesa',
          'No se pudo remover la mesa del salón.'
        );
      }
    });
  }

  onTableStatusChanged(event: { tableId: string; newStatus: DiningTableStatus }): void {
    this.diningTableService.updateTableStatus(event.tableId, event.newStatus).subscribe({
      next: () => {
        this.sweetAlertService.showSuccess(
          'Estado actualizado',
          'El estado de la mesa se actualizó correctamente.'
        );
        this.closeTableDetailModal();
      },
      error: (err) => {
        console.error('Error al cambiar el estado de la mesa:', err);
        this.sweetAlertService.showError(
          'Error al actualizar estado',
          'No se pudo cambiar el estado de la mesa.'
        );
      }
    });
  }

  onOrderStatusChanged(event: { orderId: string; newStatus: OrderStatus }): void {
    this.orderService.updateOrderStatus(event.orderId, event.newStatus).subscribe({
      next: () => {
        if (this.selectedTable) {
          this.loadTableSessionAndOrders(this.selectedTable);
        }
      },
      error: (err) => {
        console.error('Error al cambiar el estado de la orden:', err);
        this.sweetAlertService.showError(
          'Error al actualizar orden',
          'No se pudo cambiar el estado de la orden.'
        );
      }
    });
  }

  getStatusLabelForCard(status: DiningTableStatus): string {
  const statusMap: { [key: string]: string } = {
    'AVAILABLE': 'Disponible',
    'IN_SESSION': 'En Sesión',
    'COMPLETE': 'Completa',
    'WAITING_RESET': 'Esperando',
    'OUT_OF_SERVICE': 'Fuera de Servicio'
  };
  return statusMap[status] || status;
}
}
