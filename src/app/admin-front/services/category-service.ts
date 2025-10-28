import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import CategoryResponse from '../models/response/category-response';
import { environment } from '../../../environments/environment.development';
import CategoryRequest from '../models/request/category-request';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {


  readonly API_URL = `${environment.baseUrl}/categories`

  categories: CategoryResponse [];

  constructor (private http: HttpClient){
    this.categories = [];
  }

   getCategories(){
    return this.http.get<CategoryResponse[]>(this.API_URL)
  }

  getCategoryById(id: string){
    return this.http.get<CategoryResponse>(`${this.API_URL}/${id}`);
  }

  postCategory(category: CategoryRequest){
    return this.http.post<CategoryResponse>(this.API_URL, category);
  }

  deleteProduct(id : string){
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  updateCategory(id: string, category: CategoryRequest){
    return this.http.patch<CategoryResponse>(`${this.API_URL}/${id}`, category);
  }



}
