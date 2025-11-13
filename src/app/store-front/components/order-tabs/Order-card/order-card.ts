import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  LucideAngularModule,
  ChevronDown,
  Clock,
  CircleCheckBig,
  CircleX,
  Package,
  User,
  CookingPot,
  HandPlatter,
  CheckCheck,
} from 'lucide-angular';
import { OrderResponse } from '../../../models/order.interface';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-card.html',
})
export class OrderCardComponent {
  @Input({ required: true }) order!: OrderResponse;
  @Output() selected = new EventEmitter<{
    orderId: string;
    isSelected: boolean;
  }>();

  // --- Íconos ---
  readonly ChevronDown = ChevronDown;
  readonly Clock = Clock;
  readonly CircleCheckBig = CircleCheckBig;
  readonly CircleX = CircleX;
  readonly Package = Package;
  readonly User = User;
  readonly CheckCheck = CheckCheck;
  readonly CookingPot = CookingPot;
  readonly HandPlatter = HandPlatter;

  // --- Estado Interno ---
  isExpanded = signal(false);
  isSelected = signal(false);

  toggleExpand(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  onSelectionChange(event: Event): void {
    event.stopPropagation();

    const input = event.target as HTMLInputElement;
    this.isSelected.set(input.checked);

    this.selected.emit({
      orderId: this.order.publicId,
      isSelected: this.isSelected(),
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'APPROVED':
        return 'badge-accent';
      case 'IN_PROGRESS':
        return 'badge-primary';
      case 'COMPLETED':
        return 'badge-success';
      case 'SERVED':
        return 'badge-info';
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
      case 'IN_PROGRESS':
        return 'En Preparación';
      case 'COMPLETED':
        return 'Completado';
      case 'SERVED':
        return 'Servido';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'PENDING':
        return this.Clock;
      case 'APPROVED':
        return this.CheckCheck;
      case 'IN_PROGRESS':
        return this.CookingPot;
      case 'COMPLETED':
        return this.CircleCheckBig;
      case 'SERVED':
        return this.HandPlatter;
      case 'CANCELLED':
        return this.CircleX;
      default:
        return this.Package;
    }
  }
}