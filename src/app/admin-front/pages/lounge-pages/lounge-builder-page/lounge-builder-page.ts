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

// 🌐 COORDENADAS VIRTUALES (Ajustadas para una escala más grande)

  virtualGridWidth = 1600; // Reducido de 1600 para forzar una escala mayor

  virtualGridHeight = 800;  // Mantenido en 800



  // 📐 CONSTANTES DE AJUSTE

  gridStep = 50; // Paso para "Snap to Grid" (las mesas caen en múltiplos de 50)

  collisionBuffer = 5;



  // 📱 COORDENADAS DEL VIEWPORT (calculadas dinámicamente)

  viewportWidth = 0;

  viewportHeight = 0;

  scaleRatio = 1;







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

    this.calculateViewportDimensions();

     // Recalcular en resize

    window.addEventListener('resize', () => this.calculateViewportDimensions());

  }



  ngOnDestroy(): void {

    window.removeEventListener('resize', () => this.calculateViewportDimensions());

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



  calculateViewportDimensions(): void {

    // Obtener el contenedor padre (ej: 90% del ancho disponible)

    const containerElement = document.querySelector('.lounge-container');

    if (!containerElement) return;



    const availableWidth = containerElement.clientWidth -64; // Padding

    const availableHeight = window.innerHeight-150; // Header + controles + leyenda



    // Calcular escala manteniendo aspect ratio

    const scaleX = availableWidth / this.virtualGridWidth;

    const scaleY = availableHeight / this.virtualGridHeight;



    // Usar la escala menor para que TODO quepa

    this.scaleRatio = Math.min(scaleX, scaleY, 1); // Max 1 para no agrandar



    this.viewportWidth = this.virtualGridWidth * this.scaleRatio;

    this.viewportHeight = this.virtualGridHeight * this.scaleRatio;

  }



  // 🔄 CONVERTIR coordenadas virtuales → viewport

  toViewportCoords(virtualX: number, virtualY: number): { x: number, y: number } {

    return {

      x: virtualX * this.scaleRatio,

      y: virtualY * this.scaleRatio

    };

  }



 // 🔄 CONVERTIR coordenadas viewport → virtuales (para guardar)

toVirtualCoords(viewportX: number, viewportY: number): { x: number, y: number } {

  // Conversión pura

  const rawVirtualX = viewportX / this.scaleRatio;

  const rawVirtualY = viewportY / this.scaleRatio;



  // 🎯 Snap to Grid: Redondear al múltiplo de gridStep más cercano

  return {

    x: Math.round(rawVirtualX / this.gridStep) * this.gridStep,

    y: Math.round(rawVirtualY / this.gridStep) * this.gridStep

  };

  }



  // 🎨 OBTENER posiciones escaladas para renderizado

  get scaledTablesInCurrentSector() {

    return this.tablesInCurrentSector.map(table => ({

      ...table,

      displayX: table.positionX * this.scaleRatio,

      displayY: table.positionY * this.scaleRatio,

      displayWidth: (table.width || 80) * this.scaleRatio,

      displayHeight: (table.height || 80) * this.scaleRatio

    }));

  }







  // ===================================

  // Lógica de Movimiento (Actualizada)

  // ===================================



  onDrop(event: DragEvent): void {

    event.preventDefault();



    if (!this.draggedTable) return;



    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  const tableWidth = (this.draggedTable.width || 80) * this.scaleRatio;

    const tableHeight = (this.draggedTable.height || 80) * this.scaleRatio;

// 1. Coordenadas del ratón relativas al contenedor de drop

  const dropX = event.offsetX; // Posición X del ratón dentro del div

  const dropY = event.offsetY; // Posición Y del ratón dentro del div



  // 2. Calcular la nueva posición de la esquina superior izquierda de la tabla (centrada en el ratón)

  const viewportX = Math.max(0, Math.min(

      dropX - tableWidth / 2, // Centrado en el cursor

      this.viewportWidth - tableWidth

  ));

  const viewportY = Math.max(0, Math.min(

      dropY - tableHeight / 2, // Centrado en el cursor

      this.viewportHeight - tableHeight

  ));

      // 🔄 CONVERTIR A COORDENADAS VIRTUALES

    const virtualCoords = this.toVirtualCoords(viewportX, viewportY);



    // Validar colisión EN COORDENADAS VIRTUALES

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

  }





     // ✅ VALIDACIÓN en coordenadas virtuales

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



    // 🎯 APLICAR BUFFER: Sumar el buffer a los límites de colisión

    const overlapX = virtualX < table.positionX + tableWidth + this.collisionBuffer &&

                     virtualX + width + this.collisionBuffer > table.positionX;



    const overlapY = virtualY < table.positionY + tableHeight + this.collisionBuffer &&

                     virtualY + height + this.collisionBuffer > table.positionY;



    // Para un rectángulo, la colisión ocurre cuando NO hay separación en ambos ejes.

    // La lógica de colisión de rectángulos es correcta, pero hay que quitar el buffer

    // porque el buffer ya está incluido en la posición de inicio/fin para relajar la condición.



    // Corrección para relajar la condición (simplemente hacer que se puedan solapar por el buffer)

    const overlapXRelaxed = virtualX < table.positionX + tableWidth &&

                            virtualX + width > table.positionX;



    const overlapYRelaxed = virtualY < table.positionY + tableHeight &&

                            virtualY + height > table.positionY;



    // Si la colisión es exacta (sin buffer), la lógica actual es correcta.

    // Si queremos que se puedan acercar a 10px, debemos relajar:



    // Si la distancia entre ellas es menor al buffer, consideramos colisión

    const distanceX = Math.abs(virtualX - table.positionX) - ((width + tableWidth) / 2);

    const distanceY = Math.abs(virtualY - table.positionY) - ((height + tableHeight) / 2);



    // Volver a la lógica de colisión simple, pero añadiendo la holgura (buffer):

    const overlapXBuffer = virtualX < table.positionX + tableWidth - this.collisionBuffer &&

                           virtualX + width - this.collisionBuffer > table.positionX;

    const overlapYBuffer = virtualY < table.positionY + tableHeight - this.collisionBuffer &&

                           virtualY + height - this.collisionBuffer > table.positionY;



    return overlapXBuffer && overlapYBuffer;

    });

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
