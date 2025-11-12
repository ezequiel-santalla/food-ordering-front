import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category-service';
import CategoryResponse from '../../../models/response/category-response';
import CategoryRequest from '../../../models/request/category-request';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

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
  templateUrl: './category-form-page.html', // Usando el HTML dinámico de antes
})
export class CategoryFormPage implements OnInit {
  categoryForm!: FormGroup;
  parentOptions: CategoryFlatOption[] = [];
  categoryId: string | null = null;
  isEditMode: boolean = false;
  private sweetAlertService = inject(SweetAlertService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);

  ngOnInit(): void {
    // 1. Determinar el modo: Edición si hay 'id' en la ruta.
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;

    this.initForm(); // 2. Cargar las opciones de categorías padre primero
    this.loadParentCategories(); // 3. Si es edición, cargar los datos
    if (this.isEditMode) {
      this.loadCategoryForEdit(this.categoryId!);
    }
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      parentId: [null],
    });
  }

  loadCategoryForEdit(id: string): void {
    this.categoryService.getCategoryById(id).subscribe({
      // Usamos 'any' en la respuesta para acceder al 'parentCategoryId' no tipado
      // y así no modificar tu interfaz CategoryResponse.
      next: (category: any) => {
        this.categoryForm.patchValue({
          name: category.name, // Rellenar con el ID del padre (o null si es categoría raíz)
          parentId: category.parentCategoryId || null,
        }); // Ahora que los datos están cargados, verificamos si hay un parentId en el query param
        this.checkForParentId();
      },
      error: (err) => {
        console.error('Error al cargar la categoría para edición:', err);
        this.sweetAlertService.showError('No se pudo cargar la categoría para edición', 'intente nuevamente');
        this.router.navigate(['/admin/categories']);
      },
    });
  }
  private flattenCategories(
    categories: CategoryResponse[],
    prefix: string = '',
    excludeId: string | null = null
  ): CategoryFlatOption[] {
    let result: CategoryFlatOption[] = [];

    categories.forEach((category) => {
      // Excluir la categoría que se está editando
      if (category.publicId === excludeId) {
        return;
      }
      const name = prefix ? `${prefix} -> ${category.name}` : category.name;

      result.push({ id: category.publicId, name: name });

      if (
        category.childrenCategories &&
        category.childrenCategories.length > 0
      ) {
        result = result.concat(
          this.flattenCategories(category.childrenCategories, name, excludeId)
        );
      }
    });
    return result;
  }

  private prepareParentOptions(
    categories: CategoryResponse[],
    excludeId: string | null = null
  ): void {
    this.parentOptions = [{ id: null, name: 'Sin categoría padre (raíz)' }];
    const flatList = this.flattenCategories(categories, '', excludeId);
    this.parentOptions = this.parentOptions.concat(flatList);
  }

  loadParentCategories(): void {
    this.categoryService
      .getCategories()
      .subscribe((categories: CategoryResponse[]) => {
        // Pasamos this.categoryId para excluir la categoría actual de la lista de padres disponibles
        this.prepareParentOptions(categories, this.categoryId); // Solo se llama a checkForParentId si el formulario no se ha rellenado (es decir, en modo creación)
        if (!this.isEditMode) {
          this.checkForParentId();
        }
      });
  }

  checkForParentId(): void {
    const queryParentId = this.route.snapshot.queryParamMap.get('parentId'); // Solo aplicar en modo creación y si hay un parentId en la URL
    if (!this.isEditMode && queryParentId && this.parentOptions.length > 1) {
      this.categoryForm.get('parentId')?.setValue(queryParentId);
    }
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      alert('Por favor, completa el nombre de la categoría.');
      return;
    }

    const rawFormData = this.categoryForm.value; // 1. Normalizar el parentId: convierte la cadena 'null' del select a valor null real
    const parentIdValue =
      rawFormData.parentId === 'null' || rawFormData.parentId === ''
        ? null
        : rawFormData.parentId; // 2. Construir el payload dinámicamente: // Creamos un objeto genérico y le asignamos 'parentCategoryId' solo si no es null.

    let finalPayload: any = { name: rawFormData.name };

    if (parentIdValue) {
      finalPayload.parentCategoryId = parentIdValue;
    } // 3. Lógica de Reutilización (Crear vs. Actualizar)

    let serviceCall;
    const payloadForService = finalPayload as CategoryRequest;

    if (this.isEditMode && this.categoryId) {
      // Llama a updateCategory
      serviceCall = this.categoryService.updateCategory(
        this.categoryId,
        payloadForService
      );
    } else {
      // Llama a postCategory
      serviceCall = this.categoryService.postCategory(payloadForService);
    } // 4. Suscribirse a la llamada

    serviceCall.subscribe({
      next: () => {
        const action = this.isEditMode ? 'actualizada' : 'creada';
        this.sweetAlertService.showSuccess(`Categoría "${rawFormData.name}" ${action} con éxito.`);
        this.router.navigate(['/admin/categories']);
      },
      error: (err) => {
        console.error(
          `Error al ${this.isEditMode ? 'actualizar' : 'crear'} categoría:`,
          err
        );
        this.sweetAlertService.showError('Hubo un error al procesar la categoría', 'intente nuevamente');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/categories']);
  }
}
