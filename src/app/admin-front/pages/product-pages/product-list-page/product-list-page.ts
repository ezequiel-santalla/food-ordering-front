import { Component, ElementRef, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-list-page',
  imports: [RouterLink, CommonModule],
  templateUrl: './product-list-page.html',
  styleUrl: './product-list-page.css'
})
export class ProductListPage {
  openMenuIndex: number | null = null;

    constructor(public productService: ProductService,
                private eRef: ElementRef,
                private router: Router
    ){}

      ngOnInit(): void {
        this.getProducts();
        console.log(this.productService.products)
      }

      getProducts(){
        this.productService.getProducts().subscribe({
          next: (data) => {this.productService.contents = data;
                            console.log(data);},
          error: (e) => {console.error(e)}
        })
      }
toggleMenu(index: number): void {

    this.openMenuIndex = this.openMenuIndex === index ? null : index;
}

@HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    // Si el clic fue fuera del elemento del componente
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.openMenuIndex = null;
    }}

deleteProduct(id: string): void {
   this.productService.deleteProduct(id).subscribe({
      next: () => {
        alert("Producto eliminado exitosamente");
        this.getProducts();},
      error: (e) => {console.log(e)}})
}

navigateToDetail(id:string): void {
  this.router.navigate([`/products/product-detail/${id}`]);
}
navigateToEdit(id:string): void{
  this.router.navigate([`/products/add/${id}`]);
}

}
