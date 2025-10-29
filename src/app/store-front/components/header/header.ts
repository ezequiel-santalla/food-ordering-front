import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Bell,
  User,
  LogOut,
  QrCode,
  UtensilsCrossed,
} from 'lucide-angular';
import { MenuService } from '../../services/menu.service';
import { CategoryService } from '../../services/category.service';
import { TableSessionService } from '../../services/table-session.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './header.html',
})
export class Header {
  readonly Bell = Bell;
  readonly User = User;
  readonly Logout = LogOut;
  readonly QrCode = QrCode;
  readonly UtensilsCrossed = UtensilsCrossed;

  menuService = inject(MenuService);
  categoryService = inject(CategoryService);
  tableSessionService = inject(TableSessionService);
  authService = inject(AuthService);
  private router = inject(Router);

  // Info de la sesión de mesa
  tableSession = this.tableSessionService.tableSessionInfo;
  hasActiveSession = this.tableSessionService.hasActiveSession;

  menuResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.menuService.getMenu();
    },
  });

  categories = computed(() => {
    const menuData = this.menuResource.value();
    if (!menuData) return [{ id: 'all', name: 'Todos' }];
    console.log('🔍 Header - Sesión de mesa:', this.tableSession());

    const allProducts: any[] = [];

    const extractProducts = (category: any) => {
      if (category.products) {
        allProducts.push(...category.products);
      }
      if (category.subcategory) {
        category.subcategory.forEach((sub: any) => extractProducts(sub));
      }
    };

    menuData.menu.forEach((cat: any) => extractProducts(cat));

    const uniqueCategories = new Map<string, string>();
    allProducts.forEach((product) => {
      uniqueCategories.set(product.category, product.category);
    });

    const categoryList = [{ id: 'all', name: 'Todos' }];
    uniqueCategories.forEach((name) => {
      categoryList.push({ id: name.toLowerCase(), name: name });
    });

    return categoryList;
  });

  selectedCategory = this.categoryService.selectedCategory;

  venueImageUrl = computed(() => {
    return this.menuResource.value()?.foodVenueImageUrl;
  });

  venueName = computed(() => {
    return this.menuResource.value()?.foodVenueName;
  });

  participantNickname = computed(() => {
    const nickname =
      this.tableSessionService.tableSessionInfo().participantNickname;
    return nickname.toLowerCase().startsWith('guest') ? 'Invitado' : nickname;
  });

  selectCategory(categoryId: string) {
    this.categoryService.setCategory(categoryId);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.router.navigate(['/food-venues']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        // Incluso con error, se limpia localmente y se redirige
        this.router.navigate(['/food-venues']);
      },
    });
  }

  endSession() {
    this.tableSessionService.closeSession();
  }

  leaveSession() {
    this.tableSessionService.leaveSession();
  }
}
