
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category-service';
import CategoryResponse from '../../../models/response/category-response';
import CategoryRequest from '../../../models/request/category-request';

interface CategoryForm {
  name: string;
  parentId: string | null;
}

interface CategoryFlatOption {
  id: string | null;
  name: string;
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form-page.html',
})
export class CategoryFormPage implements OnInit {
  categoryForm!: FormGroup;

  parentOptions: CategoryFlatOption[] = [];

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);

  ngOnInit(): void {
    this.initForm();
    this.loadParentCategories();
    this.checkForParentId();
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      // Inicialmente, nulo para indicar categoría raíz
      parentId: [''],
    });
  }

  private flattenCategories(categories: CategoryResponse[], prefix: string = ''): CategoryFlatOption[] {
    let result: CategoryFlatOption[] = [];

    categories.forEach(category => {
      const name = prefix ? `${prefix} -> ${category.name}` : category.name;

      result.push({ id: category.publicId, name: name });

      if (category.childrenCategories && category.childrenCategories.length > 0) {
        // Llamada recursiva con el prefijo actualizado
        result = result.concat(this.flattenCategories(category.childrenCategories, name));
      }
    });
    return result;
  }


  loadParentCategories(): void {
    this.categoryService.getCategories().subscribe(categories => {
      // 1. Opción de Categoría Raíz (Sin Padre)
      this.parentOptions = [{ id: null, name: 'Sin categoría padre (raíz)' }];

      // 2. Opciones aplanadas con jerarquía
      const flatList = this.flattenCategories(categories);
      this.parentOptions = this.parentOptions.concat(flatList);

      // Si hay un parentId inicial, ajustamos el formulario después de cargar las opciones
      this.checkForParentId();
    });
  }

  // Verifica si se navegó desde 'Agregar Subcategoría'
  checkForParentId(): void {
    const parentId = this.route.snapshot.queryParamMap.get('parentId');
    if (parentId && this.parentOptions.length > 1) { // Asegurarse de que ya se cargaron las opciones
      // Establecer el valor del control 'parentId' en el ID de la categoría padre
      this.categoryForm.get('parentId')?.setValue(parentId);
    }
  }

  onSubmit(): void {
        if (this.categoryForm.invalid) {
            alert('Por favor, completa el nombre de la categoría.');
            return;
        }

        // 1. Obtener el valor del formulario directamente
        const rawFormData = this.categoryForm.value;

        // 2. Crear el objeto que cumple con la interfaz CategoryRequest
        // Asignamos el tipo explícitamente a CategoryRequest para que TypeScript valide.
        const categoryPayload: CategoryRequest = {
            name: rawFormData.name,
            // Convertir la cadena 'null' del select a valor null real para el backend
            parentCategoryId: rawFormData.parentId === 'null' || rawFormData.parentId === ''
                      ? null
                      : rawFormData.parentId
        };

        // El error de tipo debería desaparecer aquí.
        this.categoryService.postCategory(categoryPayload).subscribe({
            next: () => {
                alert(`Categoría "${categoryPayload.name}" creada con éxito.`);
                this.router.navigate(['/admin/categories']);
            },
            error: (err) => {
                console.error('Error al crear categoría:', err);
                alert('Hubo un error al crear la categoría.');
            }
        });
    }

  onCancel(): void {
    this.router.navigate(['/admin/categories']);
  }
}
