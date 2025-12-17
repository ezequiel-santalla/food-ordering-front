import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth-service';
import { SessionUtils } from '../../../utils/session-utils';
import { JwtUtils } from '../../../utils/jwt-utils';
import { FoodVenueService } from '../../services/food-venue-service';
import AdminInfo from '../../models/user-info';
import {
  LucideAngularModule,
  Store,
  LayoutDashboard,
  ClipboardList,
  CircleDollarSign,
  Package,
  LayoutGrid,
  Tags,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, RouterLinkActive, CommonModule, LucideAngularModule],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard implements OnInit {

  // Iconos de Lucide
  readonly storeIcon = Store;
  readonly dashboardIcon = LayoutDashboard;
  readonly clipboardIcon = ClipboardList;
  readonly circleDollarSignIcon = CircleDollarSign;
  readonly packageIcon = Package;
  readonly layoutGridIcon = LayoutGrid;
  readonly tagsIcon = Tags;
  readonly usersIcon = Users;
  readonly settingsIcon = Settings;
  readonly logOutIcon = LogOut;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;

  @Input() isCollapsed: boolean = true;
  @Output() toggleRequest = new EventEmitter<void>();

  adminInfo: AdminInfo = {
    email: 'Cargando...',
    role: 'Cargando...',
    foodVenueName: 'Cargando...'
  };

  constructor(
    private authService: AuthService,
    private foodVenueService: FoodVenueService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadFoodVenueName();
  }

  loadUserInfo(): void {
    const accessToken = SessionUtils.getCleanStorageValue('accessToken');

    if (accessToken) {
      const decodedToken = JwtUtils.decodeJWT(accessToken);

      if (decodedToken) {
        this.adminInfo.email = decodedToken.sub || 'Email no disponible';
        let userRole = decodedToken.role || 'Usuario';
        userRole = userRole.replace('ROLE_', '').toLowerCase();
        this.adminInfo.role = userRole.charAt(0).toUpperCase() + userRole.slice(1);
      } else {
        console.error('❌ Token decodificado inválido en AdminDashboard');
      }
    } else {
      console.warn('⚠️ No se encontró accessToken en localStorage para AdminDashboard');
    }
  }

  loadFoodVenueName(): void {
    this.foodVenueService.getMyFoodVenue().subscribe({
      next: (foodVenue) => {
        if (foodVenue && foodVenue.name) {
          this.adminInfo.foodVenueName = foodVenue.name;
        } else {
          this.adminInfo.foodVenueName = 'Local sin nombre definido';
        }
      },
      error: (err) => {
        console.error('❌ Error cargando nombre del local:', err);
        this.adminInfo.foodVenueName = 'Error al cargar local';
      },
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado, redirigiendo...');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
        this.router.navigate(['/']);
      },
    });
  }

  onToggle() {
    this.toggleRequest.emit();
  }
}
