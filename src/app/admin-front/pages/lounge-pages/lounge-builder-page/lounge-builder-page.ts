import { Component } from '@angular/core';
import { TablePosition, TablePositionResponse } from '../../../models/loung';
import { LoungeService } from '../../../services/lounge-service';
import { TableModal } from '../../../components/table-modal/table-modal';
import { SectorModal } from '../../../components/sector-modal/sector-modal';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lounge-builder-page',
  imports: [TableModal, SectorModal, FormsModule, CommonModule],
  templateUrl: './lounge-builder-page.html',
  styleUrl: './lounge-builder-page.css'
})
export class LoungeBuilderPage {
currentSector: string = 'Planta Baja';
  sectors: string[] = ['Planta Baja', 'Primer Piso', 'Terraza'];

  tablePositions: TablePositionResponse[] = [];
  selectedTable: TablePositionResponse | null = null;

  gridWidth: number = 1200;
  gridHeight: number = 800;

  showSectorModal: boolean = false;
  showTableModal: boolean = false;

  draggedTable: TablePositionResponse | null = null;

  // Current lounge ID (you should get this from route or service)
  loungeId: string = '';

  constructor(private loungeService: LoungeService) {}

  ngOnInit(): void {
    this.loadTablePositions();
  }

  get tablesInCurrentSector(): TablePositionResponse[] {
    return this.tablePositions.filter(t => t.sector === this.currentSector);
  }

  loadTablePositions(): void {
    if (!this.loungeId) {
      // TODO: Handle no lounge selected - maybe redirect or show message
      return;
    }

    this.loungeService.getTablePositions(this.loungeId).subscribe({
      next: (positions) => {
        this.tablePositions = positions;
      },
      error: (err) => {
        console.error('Error loading table positions:', err);
      }
    });
  }

  openSectorModal(): void {
    this.showSectorModal = true;
  }

  closeSectorModal(): void {
    this.showSectorModal = false;
  }

  onSectorCreated(sectorName: string): void {
    if (!this.sectors.includes(sectorName)) {
      this.sectors.push(sectorName);
    }
    this.currentSector = sectorName;
    this.closeSectorModal();
  }

  openTableModal(): void {
    this.showTableModal = true;
  }

  closeTableModal(): void {
    this.showTableModal = false;
  }

  onTableCreated(tableData: any): void {
    // Add table to lounge at default position
    const tablePosition: TablePosition = {
      diningTableId: tableData.diningTableId,
      positionX: 100,
      positionY: 100,
      sector: this.currentSector
    };

    this.loungeService.addTablePosition(this.loungeId, tablePosition).subscribe({
      next: (newPosition) => {
        this.tablePositions.push(newPosition);
        this.closeTableModal();
      },
      error: (err) => {
        console.error('Error adding table to lounge:', err);
      }
    });
  }

  onDragStart(event: DragEvent, table: TablePositionResponse): void {
    this.draggedTable = table;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    if (!this.draggedTable) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left - 40, this.gridWidth - 80));
    const y = Math.max(0, Math.min(event.clientY - rect.top - 40, this.gridHeight - 80));

    // Update position in backend
    const updateData: TablePosition = {
      diningTableId: this.draggedTable.diningTableId,
      positionX: Math.round(x),
      positionY: Math.round(y),
      sector: this.currentSector
    };

    this.loungeService.updateTablePosition(
      this.loungeId,
      this.draggedTable.diningTableId,
      updateData
    ).subscribe({
      next: (updated) => {
        const index = this.tablePositions.findIndex(
          t => t.diningTableId === this.draggedTable!.diningTableId
        );
        if (index !== -1) {
          this.tablePositions[index] = updated;
        }
      },
      error: (err) => {
        console.error('Error updating table position:', err);
      }
    });

    this.draggedTable = null;
  }

  selectTable(table: TablePositionResponse): void {
    this.selectedTable = table;
    // TODO: Open detail modal or side panel
  }

  saveChanges(): void {
    // Changes are saved automatically on drag, but this could trigger a final sync
    alert('Cambios guardados exitosamente');
  }

  getTotalCapacity(): number {
    return this.tablesInCurrentSector.reduce(
      (sum, table) => sum + (table.diningTableCapacity || 0),
      0
    );
  }

  isRound(table: TablePositionResponse): boolean {
    // You can add shape logic based on table properties
    return (table.diningTableCapacity || 0) <= 4;
  }

  isSquare(table: TablePositionResponse): boolean {
    return (table.diningTableCapacity || 0) > 4 && (table.diningTableCapacity || 0) <= 6;
  }

  isRect(table: TablePositionResponse): boolean {
    return (table.diningTableCapacity || 0) > 6;
  }

  trackByTableId(index: number, table: TablePositionResponse): string {
    return table.publicId;
  }
}
