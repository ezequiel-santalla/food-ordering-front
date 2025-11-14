import { Component } from '@angular/core';
import { CategoryService } from '../../../services/category-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryItem } from '../../../components/category-item/category-item';
import CategoryResponse from '../../../models/response/category-response';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-category-list-page',
  imports: [CommonModule, CategoryItem],
  templateUrl: './category-list-page.html'
})
export class CategoryListPage {

  constructor(
    public categoryService: CategoryService,
    private router: Router,
    private sweetAlertService: SweetAlertService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {

    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categoryService.categories = data;
        console.log(data);
      },
      error: (e) => { console.log(e) }
    });
  }

  async handleDelete(category: CategoryResponse): Promise<void> {
    const confirmed = await this.sweetAlertService.confirmDelete(
      category.name,
      'categoría'
    );

    if (confirmed) {
      this.categoryService.deleteProduct(category.publicId).subscribe({
        next: () => {
          console.log(`Categoría ${category.name} eliminada con éxito.`);
          this.sweetAlertService.showSuccess(
            'Categoría eliminada',
            `La categoría "${category.name}" ha sido eliminada correctamente.`
          );
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error al eliminar la categoría:', err);
          this.sweetAlertService.showError(
            'Error al eliminar',
            err.message || 'No se pudo eliminar la categoría. Por favor, intenta nuevamente.'
          );
        }
      });
    }
  }

  handleAddSubcategory(parentCategory: CategoryResponse): void {
    console.log('Agregar subcategoría a:', parentCategory.name);
    this.router.navigate(['admin/categories/add'], {
      queryParams: { parentId: parentCategory.publicId }
    });
  }

  handleNewCategory(): void {
    console.log('Crear nueva categoría raíz');
    this.router.navigate(['admin/categories/add']);
  }


}
