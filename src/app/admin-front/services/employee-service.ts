import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EmployeeRequest, EmployeeResponse, EmploymentContent } from '../models/response/employee';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

readonly API_URL = `${environment.baseUrl}/employees`;

  employees: EmployeeResponse | null = null;
  contents: EmploymentContent[] = [];

  constructor(private http: HttpClient) {}

  getEmployees(page: number, email?: string, active?: boolean): Observable<EmployeeResponse> {
    let params = new HttpParams().set('page', page.toString());

    if (email) {
      params = params.set('email', email);
    }

    if (active !== undefined) {
      params = params.set('active', active.toString());
    }

    return this.http.get<EmployeeResponse>(this.API_URL, { params });
  }

  getEmployeeById(id: string): Observable<EmploymentContent> {
    return this.http.get<EmploymentContent>(`${this.API_URL}/${id}`);
  }

  createEmployee(employeeData: EmployeeRequest): Observable<EmploymentContent> {
    return this.http.post<EmploymentContent>(this.API_URL, employeeData);
  }

  updateEmployee(id: string, employeeData: EmployeeRequest): Observable<EmploymentContent> {
    return this.http.put<EmploymentContent>(`${this.API_URL}/${id}`, employeeData);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  existsByEmail(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.API_URL}/exists-by-email`, { params });
  }

}
