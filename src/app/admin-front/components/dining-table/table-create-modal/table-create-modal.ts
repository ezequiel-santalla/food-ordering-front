import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiningTableService } from '../../../services/dining-table-service';
import { DiningTableRequest } from '../../../models/dining-table';

@Component({
  selector: 'app-table-modal',
  imports: [FormsModule],
  templateUrl: './table-create-modal.html'
})
export class TableCreateModal {
  currentSector = input.required<string>();

  close = output<void>();
  tableCreated = output<any>();

  tableNumber: number | null = null;
  capacity: number | null = null;
  selectedShape: string = '';

  constructor(private diningTableService : DiningTableService) {}

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  isFormValid(): boolean {
    return !!(this.capacity && this.selectedShape);
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    const tableRequest: DiningTableRequest = {
      number: this.tableNumber!,
      capacity: this.capacity!,
     // status: 'AVAILABLE'
    };

    this.diningTableService.createTable(tableRequest).subscribe({
      next: (createdTable) => {
        this.tableCreated.emit({
          diningTableId: createdTable.publicId,
          shape: this.selectedShape
        });
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating table:', err);
        alert('Error al crear la mesa. Por favor, intenta nuevamente.');
      }
    });
  }

  resetForm(): void {
    this.tableNumber = null;
    this.capacity = null;
    this.selectedShape = '';
  }
}
