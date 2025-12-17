import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth-service';
import {
  LucideAngularModule,
  LayoutDashboard,
  ClipboardList,
  CircleDollarSign,
  Menu,
  X,
  Package,
  LayoutGrid,
  Tags,
  Users,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-angular';

@Component({
  selector: 'app-admin-mobile-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-mobile-nav.html',
  styleUrl: './admin-mobile-nav.css'
})
export class AdminMobileNav {
   // Icons
  readonly dashboardIcon = LayoutDashboard;
  readonly clipboardIcon = ClipboardList;
  readonly dollarIcon = CircleDollarSign;
  readonly menuIcon = Menu;
  readonly closeIcon = X;
  readonly packageIcon = Package;
  readonly gridIcon = LayoutGrid;
  readonly tagsIcon = Tags;
  readonly usersIcon = Users;
  readonly settingsIcon = Settings;
  readonly logOutIcon = LogOut;
  readonly chevronIcon = ChevronDown;

  // Estado del menú expandido
  isMenuExpanded = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu() {
    this.isMenuExpanded = false;
  }

  onLinkClick() {
    // Cerrar menú al navegar
    this.closeMenu();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        this.router.navigate(['/']);
      },
    });
  }

}
