import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form-page.html'
})
export class ProductFormPage {

   productForm!: FormGroup;
    isEditingMode!: boolean;

    constructor( private fb: FormBuilder,
                private productService: ProductService,
                private router: Router,
                private route: ActivatedRoute
    ){
      this.isEditingMode = false;
    }

    ngOnInit(): void {
        this.productForm = this.fb.group({
            name: ['', Validators.required],
            price: [0, [Validators.required, Validators.min(0)]],
            description: [''],
            imageUrl: [''],
            categoryId: [''],
            stock:[0],
            tagsId: [[]],
            available: [true]
        });
        const productId = this.route.snapshot.params['id'];
        if(productId){
          this.isEditingMode = true;
          this.productService.getProductById(productId).subscribe({
            next: (data) => { this.productForm.patchValue(data)},
            error: (e) => {console.error(e)}
          })
        }
    }

    onSubmit(){
      const productId = this.route.snapshot.params['id'];
      if(productId){
        if(this.productForm.valid){
          this.productService.updateProduct(productId, this.productForm.value).subscribe({
            next: (data) => {alert("Producto actualizado con exito")
                            this.router.navigate(['/products']);
            },
            error: (e) => {console.error(e)}
          })
        }
      }
      else {
        if( this.productForm.valid){
        this.productService.postProduct(this.productForm.value).subscribe({
          next: (data) => {alert("Producto creado con exito")
                          this.router.navigate(['/products'])
          },
          error: (e) => {console.error(e)}
        })
      }
    }
      }


}
