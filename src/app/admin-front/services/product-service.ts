import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Content, ProductResponse } from '../models/response/product-response';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  readonly API_URL = `${environment.baseUrl}/products`

  products: ProductResponse[];
  contents: Content[]

  constructor(private http: HttpClient) {
    this.products = [];
    this.contents = [];

  }

  getProducts(page: number) {
    let params = new HttpParams().set('page', page.toString());
    return this.http.get<ProductResponse>(this.API_URL, { params: params })
    // .pipe(map(response => response.content));
  }

  getProductById(id: string) {
    return this.http.get<Content>(`${this.API_URL}/find-by-id/${id}`);
  }

  postProduct(formData: FormData) {
    return this.http.post<Content>(this.API_URL, formData);
  }

  deleteProduct(id: string) {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  updateProduct(id: string, formData: FormData) {
    return this.http.patch<ProductResponse>(`${this.API_URL}/${id}`, formData);
  }
}
