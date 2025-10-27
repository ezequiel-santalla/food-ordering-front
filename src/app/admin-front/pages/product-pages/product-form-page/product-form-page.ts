import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import TagResponse from '../../../models/response/tag-response';
import { CategoryService } from '../../../services/category-service';
import { TagService } from '../../../services/tag-service';
import CategoryResponse from '../../../models/response/category-response';

interface LeafCategory {
  publicId: string;
  name: string;
  path: string;
}



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

  leafCategories: LeafCategory[] = [];
  availableTags: TagResponse[] = [];
  selectedTags: string[] = []; // Ahora solo guardamos los labels

  // Control del input de tags
  tagInput: string = '';
  filteredTags: TagResponse[] = [];
  isTagDropdownOpen: boolean = false;
  isCreatingTag: boolean = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadTags();
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

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.leafCategories = this.extractLeafCategories(categories);
      },
      error: (e) => {
        console.error('Error al cargar categorías:', e);
      }
    });
  }

  private extractLeafCategories(
    categories: CategoryResponse[],
    parentPath: string = ''
  ): LeafCategory[] {
    let leafs: LeafCategory[] = [];

    for (const category of categories) {
      const currentPath = parentPath
        ? `${parentPath} > ${category.name}`
        : category.name;

      if (!category.childrenCategories || category.childrenCategories.length === 0) {
        leafs.push({
          publicId: category.publicId,
          name: category.name,
          path: currentPath
        });
      } else {
        leafs = leafs.concat(
          this.extractLeafCategories(category.childrenCategories, currentPath)
        );
      }
    }

    return leafs;
  }

  private loadTags(): void {
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = tags;
        this.filterTags();
      },
      error: (e) => {
        console.error('Error al cargar tags:', e);
      }
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

    this.productForm.patchValue({
      name: data.name,
      price: data.price,
      description: data.description || '',
      categoryId: categoryId,
      stock: data.stock || 0,
      available: data.available !== undefined ? data.available : true
    });

    if (data.tags && data.tags.length > 0) {
    this.selectedTags = data.tags.map((tag: any) =>
        (typeof tag === 'string' ? tag : tag.label)
    );
    this.updateFormTags();
  }
    this.imagePreview = data.imageUrl || null;
  }


  onTagInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tagInput = input.value; // ✅ Actualiza la propiedad de la clase

    this.filterTags();
    this.isTagDropdownOpen = this.tagInput.length > 0;
  }

  onTagInputFocus(): void {
    if (this.tagInput.length > 0) {
      this.isTagDropdownOpen = true;
    }
  }

  get tagExistsOrSelected(): boolean {
      if (!this.tagInput) return false;
      const trimmedInput = this.tagInput.trim().toLowerCase();

      // 1. Ya existe en la lista general de tags disponibles
      const existsInAvailable = this.availableTags.some(
          t => t.label.toLowerCase() === trimmedInput
      );

      // 2. Ya está seleccionado para este producto
      const isSelected = this.selectedTags.some(
          t => t.toLowerCase() === trimmedInput
      );

      return existsInAvailable || isSelected;
  }

  private filterTags(): void {
    const searchTerm = this.tagInput.toLowerCase().trim();

    if (searchTerm === '') {
      this.filteredTags = [];
      return;
    }

    this.filteredTags = this.availableTags.filter(tag =>
      tag.label.toLowerCase().includes(searchTerm) &&
      !this.selectedTags.includes(tag.label)
    );
  }

  selectExistingTag(tag: TagResponse): void {
    if (!this.selectedTags.includes(tag.label)) {
      this.selectedTags.push(tag.label);
      this.updateFormTags();
    }
    this.tagInput = '';
    this.isTagDropdownOpen = false;
    this.filteredTags = [];
  }

  createAndSelectTag(): void {
    const newTagLabel = this.tagInput.trim();

    if (newTagLabel === '') {
      return;
    }

    // Verificar si ya existe (case insensitive)
    const existingTag = this.availableTags.find(
      tag => tag.label.toLowerCase() === newTagLabel.toLowerCase()
    );

    if (existingTag) {
      // Si ya existe, solo seleccionarlo
      this.selectExistingTag(existingTag);
      return;
    }

    // Verificar si ya está seleccionado
    if (this.selectedTags.includes(newTagLabel)) {
      this.tagInput = '';
      this.isTagDropdownOpen = false;
      return;
    }

    this.isCreatingTag = true;

    // Crear el tag en el backend
    this.tagService.createTag({ label: newTagLabel }).subscribe({
      next: (createdTag) => {
        // Agregar a la lista de disponibles
        this.availableTags.push(createdTag);

        // Seleccionarlo
        this.selectedTags.push(createdTag.label);
        this.updateFormTags();

        // Limpiar input
        this.tagInput = '';
        this.isTagDropdownOpen = false;
        this.filteredTags = [];
        this.isCreatingTag = false;
      },
      error: (e) => {
        console.error('Error al crear tag:', e);
        alert('Error al crear el tag. Por favor, intente nuevamente.');
        this.isCreatingTag = false;
      }
    });
  }

get tagExists(): boolean {
  if (!this.tagInput) return false;
  return this.availableTags.some(
    t => t.label.trim().toLowerCase() === this.tagInput.trim().toLowerCase()
  );
}




  removeTag(tagLabel: string): void {
    this.selectedTags = this.selectedTags.filter(t => t !== tagLabel);
    this.updateFormTags();
  }

  private updateFormTags(): void {
    this.productForm.patchValue({ tags: this.selectedTags });
  }

canCreateNewTag(): boolean {
      const trimmedInput = this.tagInput.trim();
      if (trimmedInput === '' || this.isCreatingTag) return false;

      // Solo se puede crear si NO existe en ningún lugar (disponibles o seleccionados)
      return !this.tagExistsOrSelected;
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (this.filteredTags.length > 0) {
        // Si hay resultados filtrados, seleccionar el primero
        this.selectExistingTag(this.filteredTags[0]);
      } else if (this.canCreateNewTag()) {
        // Si no hay resultados y el input es válido, crear nuevo tag
        this.createAndSelectTag();
      }
    }
  }

  // Manejo de imagen
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

  // Submit
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

    const productData = {
      name: this.productForm.value.name,
      description: this.productForm.value.description || '',
      price: this.productForm.value.price,
      stock: this.productForm.value.stock || 0,
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
