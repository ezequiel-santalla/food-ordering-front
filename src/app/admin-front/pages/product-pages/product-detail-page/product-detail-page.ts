import { Component } from '@angular/core';
import { ProductService } from '../../../services/product-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Content } from '../../../models/response/product-response';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink],
  templateUrl: './product-detail-page.html'
})
export class ProductDetailPage {

  selectedProduct!: Content;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private sweetAlertService: SweetAlertService
  ) { }

  ngOnInit(): void {
    const productId = this.route.snapshot.params['id'];

    this.productService.getProductById(productId).subscribe({
      next: (data) => {
        this.selectedProduct = data;
      },
      error: (e) => {
        console.error(e);
        this.router.navigate(['/products']);
      }
    });
  }

  deleteProduct(id: string): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.sweetAlertService.showSuccess("Producto Eliminado exitosamente");
        this.router.navigate(['/admin/products']);
      },
      error: (e) => {
        console.log(e);
      }
    });
  }
}
