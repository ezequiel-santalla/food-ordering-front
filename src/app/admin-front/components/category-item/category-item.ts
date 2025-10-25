import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import CategoryResponse from '../../models/response/category-response';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-item',
  imports: [CommonModule],
  templateUrl: './category-item.html'
})
export class CategoryItem {

  category = input.required<CategoryResponse>();
  level = input(0);
  addSubcategory = output<CategoryResponse>();
  delete = output<CategoryResponse>();


constructor(private router: Router){}
  isExpanded: boolean = false;
  isMenuOpen: boolean = false;

  private readonly indentClasses = [
    'pl-0', 'pl-4', 'pl-8', 'pl-12', 'pl-16', 'pl-20', 'pl-24'
  ];

  ngOnInit(): void {
    this.isExpanded = this.category().childrenCategories.length > 0;
  }

  toggleExpand(): void {
    if (this.category().childrenCategories.length > 0) {
      this.isExpanded = !this.isExpanded;
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  getIndentClass(): string {
    const classIndex = Math.min(this.level(), this.indentClasses.length - 1);
    return this.indentClasses[classIndex];
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = false;
    this.router.navigate(['/categories/edit', this.category().publicId]);
  }

  onAddSubcategory(event: MouseEvent): void {
    event.stopPropagation();
    this.addSubcategory.emit(this.category());
    this.isMenuOpen = false;
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit(this.category());
    this.isMenuOpen = false;
  }


}
