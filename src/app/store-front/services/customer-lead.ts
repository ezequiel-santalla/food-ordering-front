import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type CustomerLeadCreateRequest = {
  phoneNumber: string;
  email?: string;
  name?: string;
  restaurantName?: string;
  address?: string;
  notes?: string;
};

export type CustomerLeadCreatedResponse = {
  publicId: string;
  message: string;
};

@Injectable({ providedIn: 'root' })
export class CustomerLeadService {
  private http = inject(HttpClient);

  create(dto: CustomerLeadCreateRequest) {
    return this.http.post<CustomerLeadCreatedResponse>(
      `${environment.baseUrl}/public/customer-leads`,
      dto
    );
  }
}
