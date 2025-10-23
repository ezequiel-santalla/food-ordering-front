import { Component} from '@angular/core';
import CategoryResponse from '../../../models/response/category-response';
import { CategoryService } from '../../../services/category-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryItem } from '../../../components/category-item/category-item';


@Component({
  selector: 'app-category-list-page',
  imports: [CommonModule, CategoryItem],
  templateUrl: './category-list-page.html'
})
export class CategoryListPage{

  constructor( public categoryService: CategoryService,
              private router: Router){

              }
  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {

    this.categoryService.getCategories().subscribe({
      next: (data) => { this.categoryService.categories = data;
                      console.log(data);
      },
      error: (e) => { console.log(e)}
    });
  }

  handleDelete(category: CategoryResponse): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"? Esta acción es irreversible.`)) {

      this.categoryService.deleteProduct(category.publicId).subscribe({
        next: () => {
          console.log(`Categoría ${category.name} eliminada con éxito.`);
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error al eliminar la categoría:', err);
          alert(`Hubo un error al eliminar la categoría: ${err.message || 'Error desconocido'}`);
        }
      });
    }
  }

  handleAddSubcategory(parentCategory: CategoryResponse): void {
    console.log('Agregar subcategoría a:', parentCategory.name);
    this.router.navigate(['/categories/new'], {
      queryParams: { parentId: parentCategory.publicId }
    });
  }

  handleNewCategory(): void {
    console.log('Crear nueva categoría raíz');
    this.router.navigate(['/categories/add']);
  }



}


