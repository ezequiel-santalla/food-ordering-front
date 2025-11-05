import { Component, OnInit } from '@angular/core';
import { TablePosition, TablePositionResponse } from '../../../models/lounge';
import { LoungeService } from '../../../services/lounge-service';
import { TableModal } from '../../../components/table-modal/table-modal';
import { SectorModal } from '../../../components/sector-modal/sector-modal';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableDetailModal } from "../../../components/table-detail-modal/table-detail-modal";

@Component({
  selector: 'app-lounge-builder-page',
  standalone: true, // Asumimos standalone o lo tienes en imports del módulo
  imports: [TableModal, SectorModal, FormsModule, CommonModule, TableDetailModal],
  templateUrl: './lounge-builder-page.html',
  styleUrl: './lounge-builder-page.css'
})
export class LoungeBuilderPage implements OnInit { // Implementamos OnInit

  currentSector: string = 'Planta Baja';
  sectors: string[] = ['Planta Baja', 'Primer Piso', 'Terraza'];

  tablePositions: TablePositionResponse[] = [];
  selectedTable: TablePositionResponse | null = null;

  hasUnsavedChanges: boolean = false; // 🚨 NUEVA BANDERA DE CAMBIOS

  gridWidth = 1200;
  gridHeight = 800;

  showSectorModal = false;
  showTableModal = false;

  draggedTable: TablePositionResponse | null = null;

  constructor(private loungeService: LoungeService) {}

  ngOnInit(): void {
    this.initializeLounge();
  }

  // Helper para hacer actualizaciones locales
  private updateTablePositionLocal(tableId: string, updates: Partial<TablePositionResponse>): void {
    const index = this.tablePositions.findIndex(t => t.diningTableId === tableId);
    if (index !== -1) {
      // 1. Clonar y actualizar localmente
      this.tablePositions[index] = { ...this.tablePositions[index], ...updates };
      // 2. Activar la bandera de cambios
      this.hasUnsavedChanges = true;
    }
  }

  // ===================================
  // Lógica de Persistencia (Nueva)
  // ===================================

  saveLoungeChanges(): void {
    if (!this.hasUnsavedChanges) return;

    // Mapear solo las propiedades necesarias para la persistencia
    const positionsToSave: TablePosition[] = this.tablePositions.map(t => ({
      diningTableId: t.diningTableId,
      positionX: t.positionX,
      positionY: t.positionY,
      sector: t.sector,
      tableShape: t.tableShape,
      width: t.width,
      height: t.height
    }));

    // Llamada al nuevo método del servicio
    this.loungeService.saveAllTablePositions(positionsToSave).subscribe({
      next: (persistedPositions) => {
        // Opcional: Reemplazar el array completo con la respuesta del backend (para IDs o datos actualizados)
        this.tablePositions = persistedPositions;
        this.hasUnsavedChanges = false; // Desactivar la bandera
        alert('Salón guardado exitosamente.');
      },
      error: (err) => {
        console.error('Error al guardar el salón:', err);
        alert('Error al guardar el salón. Revisa la consola.');
      }
    });
  }


  // ===================================
  // Lógica de Movimiento (Actualizada)
  // ===================================

  onDrop(event: DragEvent): void {
    event.preventDefault();

    if (!this.draggedTable) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const tableWidth = this.draggedTable.width || 80;
    const tableHeight = this.draggedTable.height || 80;

    const x = Math.max(0, Math.min(event.clientX - rect.left - tableWidth/2, this.gridWidth - tableWidth));
    const y = Math.max(0, Math.min(event.clientY - rect.top - tableHeight/2, this.gridHeight - tableHeight));

    const newPositionX = Math.round(x);
    const newPositionY = Math.round(y);

    // 🚨 MODIFICACIÓN CLAVE: Actualiza el modelo local SIN llamar al servicio
    this.updateTablePositionLocal(this.draggedTable.diningTableId, {
      positionX: newPositionX,
      positionY: newPositionY,
      sector: this.currentSector,
    });

    this.draggedTable = null;
  }

  // ===================================
  // Lógica de Creación/Tamaño/Eliminación
  // ===================================

  onTableCreated(tableData: any): void {
    // ⚠️ NOTA: La creación (POST) debe seguir llamando al servicio inmediatamente
    // para obtener el diningTableId persistido.

    // ... (Tu lógica de creación permanece igual, ya que addTablePosition debe ser inmediata)
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
        this.hasUnsavedChanges = true; // La creación es un cambio no guardado
        this.closeTableModal();
      },
      error: (err) => {
        console.error('Error adding table:', err);
        alert('Error al agregar la mesa al salón');
      }
    });
  }

  onTableSizeChanged(data: { tableId: string, width: number, height: number }): void {
    const table = this.tablePositions.find(t => t.diningTableId === data.tableId);
    if (!table) return;

    // 🚨 MODIFICACIÓN CLAVE: Actualiza el modelo local SIN llamar al servicio
    this.updateTablePositionLocal(data.tableId, {
      width: data.width,
      height: data.height
    });
  }

  onTableRemoved(tableId: string): void {
    // ⚠️ NOTA: La eliminación (DELETE) debe seguir llamando al servicio inmediatamente
    // para liberar el ID de la tabla si el backend lo requiere.

    this.loungeService.removeTablePosition(tableId).subscribe({
      next: () => {
        this.tablePositions = this.tablePositions.filter(t => t.diningTableId !== tableId);
        this.hasUnsavedChanges = true; // La eliminación es un cambio no guardado
        this.closeTableDetailModal();
      },
      error: (err) => console.error('Error removing table:', err)
    });
  }

  // ... (El resto de métodos como initializeLounge, loadTablePositions, getTotalCapacity, etc., permanecen igual)

  initializeLounge(): void {
    // El backend crea el lounge automáticamente si no existe
    this.loungeService.getOrCreateLounge().subscribe({
      next: (lounge) => {
        this.gridWidth = lounge.gridWidth;
        this.gridHeight = lounge.gridHeight;
        this.loadTablePositions();
      },
      error: (err) => console.error('Error initializing lounge:', err)
    });
  }

  loadTablePositions(): void {
    this.loungeService.getTablePositions().subscribe({
      next: (positions) => {
        this.tablePositions = positions;
        this.hasUnsavedChanges = false; // Resetear al cargar
      },
      error: (err) => console.error('Error loading table positions:', err)
    });
  }

  get tablesInCurrentSector(): TablePositionResponse[] {
    return this.tablePositions.filter(t => t.sector === this.currentSector);
  }

  openSectorModal(): void { this.showSectorModal = true; }
  closeSectorModal(): void { this.showSectorModal = false; }
  openTableModal(): void { this.showTableModal = true; }
  closeTableModal(): void { this.showTableModal = false; }
  selectTable(table: TablePositionResponse): void { this.selectedTable = table; }
  closeTableDetailModal(): void { this.selectedTable = null; }
  onSectorCreated(sectorName: string): void {
    if (!this.sectors.includes(sectorName)) { this.sectors.push(sectorName); }
    this.currentSector = sectorName;
    this.hasUnsavedChanges = true; // Nuevo sector es un cambio
    this.closeSectorModal();
  }

  onDragStart(event: DragEvent, table: TablePositionResponse): void {
    this.draggedTable = table;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  getTotalCapacity(): number {
    return this.tablesInCurrentSector.reduce(
      (sum, table) => sum + (table.diningTableCapacity || 0), 0
    );
  }
}
