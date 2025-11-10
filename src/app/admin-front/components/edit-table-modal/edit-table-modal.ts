import { SweetAlertResult } from 'sweetalert2';
  import { Component, input, output, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { DiningTableRequest, DiningTableResponse} from '../../models/dining-table';
  import { DiningTableService } from '../../services/dining-table-service';
  import { DiningTableStatus, TablePositionResponse } from '../../models/lounge'; // Asumiendo este modelo para la posición/forma
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

  // Definición local de los estados para el selector
  interface StatusOption {
    key: DiningTableStatus;
    label: string;
  }

  @Component({
    selector: 'app-edit-table-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-table-modal.html'
  })
  export class EditTableModal implements OnInit {

    originalTable = input.required<TablePositionResponse>();

    close = output<void>();
    tableUpdated = output<TablePositionResponse>();

    tableNumber!: number;
    capacity!: number;
    selectedStatus!: DiningTableStatus;
    isLoading: boolean = false;

  statuses: StatusOption[] = [
      { key: DiningTableStatus.AVAILABLE, label: 'Disponible' },
      { key: DiningTableStatus.IN_SESSION, label: 'En Sesión' },
      { key: DiningTableStatus.COMPLETE, label: 'Completa' },
      { key: DiningTableStatus.WAITING_RESET, label: 'Esperando Reset' },
      { key: DiningTableStatus.OUT_OF_SERVICE, label: 'Fuera de Servicio' }
    ];

    constructor(private diningTableService: DiningTableService) {}

    ngOnInit(): void {
      this.tableNumber = this.originalTable().diningTableNumber;
      this.capacity = this.originalTable().diningTableCapacity;
      // Asegúrate de que el estado inicial sea de tipo DiningTableStatus
      this.selectedStatus = this.originalTable().diningTableStatus;
    }

    onClose(): void {
      this.close.emit();
    }

    onBackdropClick(event: MouseEvent): void {
      if (event.target === event.currentTarget) {
        this.onClose();
      }
    }

    isFormValid(): boolean {
      const original = this.originalTable();
      const numberChanged = this.tableNumber !== original.diningTableNumber;
      const capacityChanged = this.capacity !== original.diningTableCapacity;
      const statusChanged = this.selectedStatus !== original.diningTableStatus;

      const hasChanges = numberChanged || capacityChanged || statusChanged;

      return !!(this.tableNumber && this.capacity && this.selectedStatus && hasChanges);
    }

    onSubmit(): void {
      if (!this.isFormValid()) return;

      this.isLoading = true;

      const updateRequest: DiningTableRequest = {
        number: this.tableNumber,
        capacity: this.capacity,
        status: this.selectedStatus,
      };

      const tableId = this.originalTable().diningTableId;

      this.diningTableService.updateTable(tableId, updateRequest).subscribe({
        next: (updatedDto: DiningTableResponse) => {
          // Mapear el DTO de respuesta al formato TablePositionResponse para el salón
          const updatedTable: TablePositionResponse = {
              publicId: this.originalTable().publicId, // Asumo que el publicId de la posición no cambia
              diningTableId: updatedDto.publicId, // El publicId de DiningTableResponse es el ID de la mesa
              diningTableNumber: updatedDto.number,
              diningTableCapacity: updatedDto.capacity,
              diningTableStatus: updatedDto.status as DiningTableStatus, // Casteo al enum

              // Mantener las propiedades de posición y forma inalteradas
              tableShape: this.originalTable().tableShape,
              positionX: this.originalTable().positionX,
              positionY: this.originalTable().positionY,
              sector: this.originalTable().sector,
              width: this.originalTable().width,
              height: this.originalTable().height,
          };
          alert('Mesa modificada correctamente.');
          this.tableUpdated.emit(updatedTable);
          this.onClose();
        },
        error: (err) => {
          console.error('Error al actualizar la mesa:', err);
          alert('Error al actualizar la mesa. Por favor, verifica los datos e intenta de nuevo.');
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
