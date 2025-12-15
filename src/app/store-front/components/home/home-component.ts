import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TableSessionService } from '../../services/table-session-service';
import { LucideAngularModule, QrCode, Utensils, Zap, Smartphone, ArrowRight, ScanLine } from 'lucide-angular';
import { PublicHeaderComponent } from '../../../food-venues/components/public-header/public-header.component';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, PublicHeaderComponent],
  templateUrl: './home-component.html',
})
export class HomeComponent {
  private tableSession = inject(TableSessionService);
  private navigation = inject(NavigationService);

  readonly QrCode = QrCode;
  readonly Utensils = Utensils;
  readonly Zap = Zap;
  readonly Smartphone = Smartphone;
  readonly ArrowRight = ArrowRight;
  readonly ScanLine = ScanLine;

  hasActiveSession = this.tableSession.hasActiveSession;
  
  sessionInfo = this.tableSession.tableSessionInfo;

  onScanQr() {
    this.navigation.navigateToScanner();
  }

  onFoodVenues() {
    this.navigation.navigateToFoodVenues();
  }
}