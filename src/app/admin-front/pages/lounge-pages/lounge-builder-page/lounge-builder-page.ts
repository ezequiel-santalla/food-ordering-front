import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// DTOs/Interfaces
// Importaciones de DTOs de tus modelos. Se asume que existen.
import { TablePosition, TablePositionResponse, DiningTableStatus, LoungeResponse } from '../../../models/lounge';
import { OrderResponse, OrderStatus } from '../../../models/order';

// Servicios
import { LoungeService } from '../../../services/lounge-service';
import { OrderService } from '../../../services/order-service'; // Asumo que existe para onOrderStatusChanged
import { TableSessionService } from '../../../services/table-session-service'; // Requiere el placeholder o tu implementación
import { DiningTableService } from '../../../services/dining-table-service'; // Nuevo: Para actualizar el estado de la mesa
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
 // Viewport dimensions (TU CÓDIGO)
 virtualGridWidth = 1600;
 virtualGridHeight = 800;
 gridStep = 50;
 collisionBuffer = 5;
 viewportWidth = 0;
 viewportHeight = 0;
 scaleRatio = 1;

 // Data (TU CÓDIGO)
 currentSector: string = '';
 sectors: string[] = [];
 tablePositions: TablePositionResponse[] = [];
 selectedTable: TablePositionResponse | null = null;
 allOrders: OrderResponse[] = [];
 selectedTableOrders: OrderResponse[] = [];

 // State (TU CÓDIGO)
 hasUnsavedChanges: boolean = false;
 isEditingMode: boolean = false;

 // Modal/Drag (TU CÓDIGO)
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
 ) {}

 ngOnInit(): void {
 this.initializeLounge();
 this.calculateViewportDimensions();
 window.addEventListener('resize', () => this.calculateViewportDimensions());
 }

 ngOnDestroy(): void {
 window.removeEventListener('resize', () => this.calculateViewportDimensions());
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
 const containerElement = document.querySelector('.lounge-container');
 if (!containerElement) return;
 const availableWidth = containerElement.clientWidth - 64;
 const availableHeight = window.innerHeight - 250;

 const scaleX = availableWidth / this.virtualGridWidth;
 const scaleY = availableHeight / this.virtualGridHeight;

 this.scaleRatio = Math.min(scaleX, scaleY, 1);
 this.viewportWidth = this.virtualGridWidth * this.scaleRatio;
 this.viewportHeight = this.virtualGridHeight * this.scaleRatio;
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
 alert('No puedes colocar una mesa encima de otra');
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
next: (lounge: LoungeResponse) => { // Tipado explícito
 this.gridWidth = lounge.gridWidth;
 this.gridHeight = lounge.gridHeight;
 this.loadSectors();
this.loadTablePositions();
 },
 error: (err) => console.error('Error initializing lounge:', err)
});
 }

 loadTablePositions(): void {
 this.loungeService.getTablePositions().subscribe({
 next: (positions: TablePositionResponse[]) => {
 this.tablePositions = positions;
 this.hasUnsavedChanges = false;
 },
 error: (err) => console.error('Error loading table positions:', err)
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
 error: (err) => console.error('Error loading sectors:', err)
 });
 }

 // =======================================================
 // LÓGICA DE SESIÓN Y ÓRDENES (MODO SERVICIO)
// =======================================================
loadTableSessionAndOrders(table: TablePositionResponse): void {
  this.selectedTableOrders = []; // Limpiar antes de la carga

  if (table.diningTableStatus !== 'IN_SESSION') {
    return;
  }

  // Usamos el encadenamiento (switchMap) para obtener el ID de la sesión y luego los pedidos
  this.tableSessionService.getLatestSessionByTableId(table.diningTableId).pipe(
    // 1. Usa switchMap para cambiar el Observable de Sesión a un Observable de Pedidos
    switchMap(sessionResponse => {
      const sessionId = sessionResponse.publicId; // ID de la sesión para buscar órdenes
      console.log(`Cargando pedidos para sesión: ${sessionId}`);

      // 2. Llama al endpoint de pedidos de la sesión
      // Asumiendo que quieres todos los pedidos por defecto:
      return this.tableSessionService.getOrdersByTableSession(sessionId, undefined, 0, 100);
    }),
    // 3. Maneja el resultado de los pedidos
    tap(orderPage => {
      this.selectedTableOrders = orderPage.content || [];
    }),
    // 4. Maneja el error de cualquier paso (ej. si getLatestSessionByTableId falla con 404)
    catchError(err => {
      console.warn('No hay sesión activa para la mesa o error de carga de pedidos:', err);
      this.selectedTableOrders = [];
      return of(null); // Retorna un Observable para que la cadena no se rompa
    })
  ).subscribe(); // Suscribe para ejecutar la cadena
}

endSession(): void {
  const tableId = this.selectedTable?.diningTableId;
  if (!tableId) return;

  this.tableSessionService.endSession(tableId).subscribe({
    next: () => {
      this.closeTableDetailModal();
      this.loadTablePositions(); // <-- Corregido: Usa tu método existente
    },
    error: (err) => console.error('Error al finalizar la sesión:', err)
  });
}

 toggleEditingMode(): void {
 if (this.isEditingMode && this.hasUnsavedChanges) {
 const confirmDiscard = confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir del modo edición y descartarlos?');
 if (!confirmDiscard) return;
 this.loadTablePositions();
 }
 this.isEditingMode = !this.isEditingMode;
 this.closeTableDetailModal();
 if (this.isEditingMode) {
 setTimeout(() => this.calculateViewportDimensions(), 0);
 }
 }

 selectTable(table: TablePositionResponse): void {
 this.selectedTable = table;

 if (!this.isEditingMode) {
 // MODO SERVICIO
 this.loadTableSessionAndOrders(table);
 }

 }

 closeTableDetailModal(): void {
 this.selectedTable = null;
 this.selectedTableOrders = [];
 this.loadTablePositions(); // Recargar estados de mesa
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
 next: (persistedPositions: TablePositionResponse[]) => { // Tipado explícito
 this.tablePositions = persistedPositions;
 this.hasUnsavedChanges = false;
 this.sweetAlertService.showSuccess('Salón guardado exitosamente.');
 },
 error: (err) => console.error('Error al guardar el salón:', err)
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
 diningTableId: tableData.diningTableId, // Asumimos que el modal lo genera o lo trae de una lista
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
 },
 error: (err) => console.error('Error adding table:', err)
 });
 }

 handleTableDataUpdate(updatedTable: TablePositionResponse): void {
 // Handler del Modal de Edición
this.updateTablePositionLocal(updatedTable.diningTableId, updatedTable);
this.selectedTable = null;
}

 onTableSizeChanged(data: { tableId: string, width: number, height: number }): void {
 // Handler del Modal de Edición
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
 },
 error: (err) => console.error('Error removing table:', err)
 });
 }
 onTableStatusChanged(event: { tableId: string; newStatus: DiningTableStatus }): void {

 this.diningTableService.updateTableStatus(event.tableId, event.newStatus).subscribe({
 next: () => this.closeTableDetailModal(),
 error: (err) => console.error('Error al cambiar el estado de la mesa:', err)
 });
 }
onOrderStatusChanged(event: { orderId: string; newStatus: OrderStatus }): void {
 this.orderService.updateOrderStatus(event.orderId, event.newStatus).subscribe({
 next: () => {
 if (this.selectedTable) {
 this.loadTableSessionAndOrders(this.selectedTable);
}
 },
 error: (err) => console.error('Error al cambiar el estado de la orden:', err)
 });
 }
}
