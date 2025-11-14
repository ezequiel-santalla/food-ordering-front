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
  categoryId: string | null = null;
  isEditMode: boolean = false;
  private sweetAlertService = inject(SweetAlertService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;

    this.initForm();
    this.loadParentCategories();

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
      next: (category: any) => {
        this.categoryForm.patchValue({
          name: category.name,
          parentId: category.parentCategoryId || null,
        });
        this.checkForParentId();
      },
      error: (err) => {
        console.error('Error al cargar la categoría para edición:', err);
        this.sweetAlertService.showError(
          'Error al cargar categoría',
          'No se pudo cargar la categoría para edición. Por favor, intenta nuevamente.'
        );
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
      .subscribe({
        next: (categories: CategoryResponse[]) => {
          this.prepareParentOptions(categories, this.categoryId);
          if (!this.isEditMode) {
            this.checkForParentId();
          }
        },
        error: (err) => {
          console.error('Error al cargar categorías:', err);
          this.sweetAlertService.showError(
            'Error al cargar categorías',
            'No se pudieron cargar las categorías disponibles.'
          );
        }
      });
  }

  checkForParentId(): void {
    const queryParentId = this.route.snapshot.queryParamMap.get('parentId');
    if (!this.isEditMode && queryParentId && this.parentOptions.length > 1) {
      this.categoryForm.get('parentId')?.setValue(queryParentId);
    }
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.sweetAlertService.showInfo(
        'Formulario incompleto',
        'Por favor, completa el nombre de la categoría.'
      );
      return;
    }

    const rawFormData = this.categoryForm.value;
    const parentIdValue =
      rawFormData.parentId === 'null' || rawFormData.parentId === ''
        ? null
        : rawFormData.parentId;

    let finalPayload: any = { name: rawFormData.name };

    if (parentIdValue) {
      finalPayload.parentCategoryId = parentIdValue;
    }

    let serviceCall;
    const payloadForService = finalPayload as CategoryRequest;

    if (this.isEditMode && this.categoryId) {
      serviceCall = this.categoryService.updateCategory(
        this.categoryId,
        payloadForService
      );
    } else {
      serviceCall = this.categoryService.postCategory(payloadForService);
    }

    serviceCall.subscribe({
      next: () => {
        const action = this.isEditMode ? 'actualizada' : 'creada';
        this.sweetAlertService.showSuccess(
          'Categoría guardada',
          `La categoría "${rawFormData.name}" fue ${action} correctamente.`
        );
        this.router.navigate(['/admin/categories']);
      },
      error: (err) => {
        console.error(
          `Error al ${this.isEditMode ? 'actualizar' : 'crear'} categoría:`,
          err
        );
        const action = this.isEditMode ? 'actualizar' : 'crear';
        this.sweetAlertService.showError(
          `Error al ${action} categoría`,
          'Hubo un error al procesar la categoría. Por favor, intenta nuevamente.'
        );
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/categories']);
  }
}
