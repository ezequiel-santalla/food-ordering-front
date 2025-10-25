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
  isEditingMode!: boolean;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.isEditingMode = false;
  }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      categoryId: ['', Validators.required],
      stock: [0],
      tags: [[]],
      available: [true]
    });

    const productId = this.route.snapshot.params['id'];
    if (productId) {
      this.isEditingMode = true;
      this.productService.getProductById(productId).subscribe({
        next: (data) => {
          this.productForm.patchValue(data);
          this.imagePreview = data.imageUrl;
        },
        error: (e) => {
          console.error(e);
        }
      });
    }
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
    const productId = this.route.snapshot.params['id'];

    if (productId) {
      if (this.productForm.valid) {
        this.productService.updateProduct(productId, this.productForm.value).subscribe({
          next: (data) => {
            alert("Producto actualizado con éxito");
            this.router.navigate(['/admin/products']);
          },
          error: (e) => {
            console.error('Error al actualizar:', e);
            alert('Error al actualizar el producto');
          }
        });
      }
    } else {
      if (this.productForm.valid) {
        const formData = this.createFormData();

        this.productService.postProduct(formData).subscribe({
          next: () => {
            alert("Producto creado con éxito");
            this.router.navigate(['/admin/products']);
          },
          error: (e) => {
            console.error('Error al crear:', e);
            alert('Error al crear el producto');
          }
        });
      } else {
        alert('Por favor completa todos los campos requeridos');
      }
    }
  }

  private createFormData(): FormData {
    const formData = new FormData();

    const productData = {
      name: this.productForm.value.name,
      description: this.productForm.value.description || '',
      price: this.productForm.value.price,
      stock: this.productForm.value.stock,
      available: this.productForm.value.available,
      categoryId: this.productForm.value.categoryId || null,
      tags: this.productForm.value.tags || []
    };

    formData.append('product', new Blob([JSON.stringify(productData)], {
      type: 'application/json'
    }));

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    formData.append('cloudinaryFolder', 'PRODUCTS');

    return formData;
  }
}
