import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerLeadService } from '../../services/customer-lead';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-contact-us-lead-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-us-lead-card.html',
})
export class ContactUsLeadCard {
  private leads = inject(CustomerLeadService);
  private sweet = inject(SweetAlertService);

  expanded = false;
  isLoading = false;

  phoneNumber = '';
  email = '';
  name = '';
  restaurantName = '';
  address = '';
  notes = '';

  successMessage = '';
  errorMessage = '';

  submit() {
    this.errorMessage = '';
    this.successMessage = '';

    const phone = this.phoneNumber.trim();
    if (!phone) return;

    this.isLoading = true;

    this.leads.create({
      phoneNumber: phone,
      email: this.email.trim() || undefined,
      name: this.name.trim() || undefined,
      restaurantName: this.restaurantName.trim() || undefined,
      address: this.address.trim() || undefined,
      notes: this.notes.trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || '¡Listo! Te vamos a contactar.';
        this.sweet.showSuccess('Enviado', '¡Gracias! Te llamamos a la brevedad.', 1800);

        this.phoneNumber = '';
        this.email = '';
        this.name = '';
        this.restaurantName = '';
        this.address = '';
        this.notes = '';
        this.expanded = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'No pudimos enviar tu contacto. Probá de nuevo.';
        this.sweet.showError('Ups', 'No pudimos enviar tu contacto. Probá de nuevo.');
      }
    });
  }
}
