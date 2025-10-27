import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './product-form-page.html'
})
export class ProductFormPage {
  productForm!: FormGroup;
  isEditingMode: boolean = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProductIfEditMode();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      categoryId: [''],
      stock: [0, [Validators.min(0)]],
      tags: [[]],
      available: [true]
    });
  }

  private loadProductIfEditMode(): void {
    const productId = this.route.snapshot.params['id'];

    if (productId) {
      this.isEditingMode = true;
      this.productService.getProductById(productId).subscribe({
        next: (data) => {
          this.populateForm(data);
        },
        error: (e) => {
          console.error('Error al cargar producto:', e);
          alert('Error al cargar el producto');
          this.router.navigate(['/admin/products']);
        }
      });
    }
  }

  private populateForm(data: any): void {
    const categoryId = data.category?.publicId || '';

    const tagLabels = data.tags && Array.isArray(data.tags)
      ? data.tags.map((tag: any) => tag.label || tag)
      : [];

    this.productForm.patchValue({
      name: data.name,
      price: data.price,
      description: data.description || '',
      categoryId: categoryId,
      stock: data.stock || 0,
      tags: tagLabels,
      available: data.available !== undefined ? data.available : true
    });

    this.imagePreview = data.imageUrl || null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  onSubmit(): void {
    if (!this.productForm.valid) {
      this.showValidationErrors();
      return;
    }

    const formData = this.createFormData();
    const productId = this.route.snapshot.params['id'];

    if (this.isEditingMode && productId) {
      this.updateProduct(productId, formData);
    } else {
      this.createProduct(formData);
    }
  }

  private createProduct(formData: FormData): void {
    this.productService.postProduct(formData).subscribe({
      next: () => {
        alert("Producto creado con éxito");
        this.router.navigate(['/admin/products']);
      },
      error: (e) => {
        console.error('Error al crear:', e);
        alert('Error al crear el producto. Por favor, intente nuevamente.');
      }
    });
  }

  private updateProduct(productId: string, formData: FormData): void {
    this.productService.updateProduct(productId, formData).subscribe({
      next: () => {
        alert("Producto actualizado con éxito");
        this.router.navigate(['/admin/products']);
      },
      error: (e) => {
        console.error('Error al actualizar:', e);
        alert('Error al actualizar el producto. Por favor, intente nuevamente.');
      }
    });
  }

  private createFormData(): FormData {
    const formData = new FormData();

    const formValues = this.productForm.value;

    const categoryId = formValues.categoryId && formValues.categoryId.trim() !== ''
      ? formValues.categoryId
      : undefined;

    const tags = Array.isArray(formValues.tags)
      ? formValues.tags.filter((tag: any) => typeof tag === 'string' && tag.trim() !== '')
      : [];

    const productData: any = {
      name: formValues.name,
      description: formValues.description || '',
      price: formValues.price,
      stock: formValues.stock || 0,
      available: formValues.available,
      tags: tags
    };

    if (categoryId) {
      productData.categoryId = categoryId;
    }

    formData.append('product', new Blob([JSON.stringify(productData)], {
      type: 'application/json'
    }));

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    formData.append('cloudinaryFolder', 'PRODUCTS');

    return formData;
  }

  private showValidationErrors(): void {
    const errors: string[] = [];

    if (this.productForm.get('name')?.hasError('required')) {
      errors.push('El nombre es requerido');
    }

    if (this.productForm.get('price')?.hasError('required')) {
      errors.push('El precio es requerido');
    }

    if (this.productForm.get('price')?.hasError('min')) {
      errors.push('El precio debe ser mayor o igual a 0');
    }

    if (this.productForm.get('stock')?.hasError('min')) {
      errors.push('El stock debe ser mayor o igual a 0');
    }

    const errorMessage = errors.length > 0
      ? `Por favor corrija los siguientes errores:\n${errors.join('\n')}`
      : 'Por favor completa todos los campos requeridos';

    alert(errorMessage);
  }
}
