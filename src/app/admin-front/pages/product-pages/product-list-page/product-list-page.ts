import { Component, ElementRef, HostListener, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product-service';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from "../../../../shared/components/pagination/pagination.component";
import { PaginationService } from '../../../../shared/components/pagination/pagination.service';
import { Content, ProductResponse } from '../../../models/response/product-response';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-product-list-page',
  imports: [RouterLink, CommonModule, PaginationComponent],
  templateUrl: './product-list-page.html'
})
export class ProductListPage {
  openMenuIndex: number | null = null;
  totalPages = 1;

  searchTerm: string = '';
  private allContents: Content[] = [];

  get filteredContents(): Content[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.productService.contents;
    return this.allContents.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description?.toLowerCase().includes(term))
    );
  }


  constructor(
    public productService: ProductService,
    private paginationService: PaginationService,
    private eRef: ElementRef,
    private router: Router,
    private sweetAlertService: SweetAlertService
  ) {
    effect(() => {
      const page = this.paginationService.currentPage();
      this.getProducts(page);
    });
  }

  ngOnInit(): void {
    this.getProducts();
    this.loadAllForSearch();
  }

  getProducts(page: number = 1): void {
    this.productService.getProducts(page - 1).subscribe({
      next: (data: ProductResponse) => {
        this.productService.contents = data.content;
        this.totalPages = data.totalPages;
      },
      error: (e) => console.error(e),
    });
  }


private loadAllForSearch(): void {
    this.productService.getAllProducts().subscribe({
      next: (data: ProductResponse) => {
        this.allContents = data.content;
        console.log('allContents cargados:', this.allContents.length);
      },
      error: (e) => console.error('Error loadAllForSearch:', e)
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }


  toggleMenu(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.eRef.nativeElement.contains(target);

    const isMenuButton = target.closest('button[aria-expanded]');
    const isDropdownMenu = target.closest('[id^="menu-"]');

    if (!clickedInside || (!isMenuButton && !isDropdownMenu)) {
      this.openMenuIndex = null;
    }
  }

  deleteProduct(id: string): void {
    this.openMenuIndex = null;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.sweetAlertService.showSuccess("Producto eliminado correctamente")
        this.getProducts();
        this.loadAllForSearch();
      },
      error: (e) => {
        console.log(e);
        this.sweetAlertService.showError("Error al eliminar el producto","")
      }
    });
  }
}
