import { Component, ElementRef, HostListener, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product-service';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from "../../../../shared/components/pagination/pagination.component";
import { PaginationService } from '../../../../shared/components/pagination/pagination.service';
import { ProductResponse } from '../../../models/response/product-response';

@Component({
  selector: 'app-product-list-page',
  imports: [RouterLink, CommonModule, PaginationComponent],
  templateUrl: './product-list-page.html'})

export class ProductListPage {
  openMenuIndex: number | null = null;
totalPages = 1;


    constructor(public productService: ProductService,
                private paginationService: PaginationService,
                private eRef: ElementRef,
                private router: Router
    ){
       effect(() => {
      const page = this.paginationService.currentPage();
      this.getProducts(page);
    });
    }

      ngOnInit(): void {
        this.getProducts();

        console.log(this.productService.products)
      }

      // getProducts(){
      //   this.productService.getProducts().subscribe({
      //     next: (data) => {this.productService.contents = data;
      //                       console.log(data);},
      //     error: (e) => {console.error(e)}
      //   })
      // }
      getProducts(page: number = 1): void {
        this.productService.getProducts(page - 1).subscribe({
        next: (data: ProductResponse) => {
    this.productService.contents = data.content;
    this.totalPages = data.totalPages;
  },
      error: (e) => console.error(e),
    });
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
  this.router.navigate([`/products/${id}`]);
}
navigateToEdit(id:string): void{
  this.router.navigate([`/products/add/${id}`]);
}

}
