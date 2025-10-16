import { Component } from '@angular/core';
import { ProductService } from '../../../services/product-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Content, ProductResponse } from '../../../models/response/product-response';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink],
  templateUrl: './product-detail-page.html'
})
export class ProductDetailPage {

    selectedProduct!: Content;

  constructor(private productService: ProductService,
            private route: ActivatedRoute,
            private router: Router){}

  ngOnInit(): void {
      const productId = this.route.snapshot.params['id'];
      this.productService.getProductById(productId).subscribe({
        next: (data) => { this.selectedProduct = data},
        error: (e) => {console.error(e)}
      })
  }

  deleteProduct(id : string){
    this.productService.deleteProduct(id).subscribe({
      next: () => { alert("Producto Eliminado exitosamente")
                  this.router.navigate(['/products'])
      },
      error: (e) => {console.log(e)}
    })
  }
}
