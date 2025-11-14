import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  selectedCategory = signal<string>('all');

  setCategory(category: string) {
    this.selectedCategory.set(category);
  }
}
