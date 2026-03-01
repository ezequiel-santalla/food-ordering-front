import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableSessionService } from '../../services/table-session-service';
import {
  LucideAngularModule,
  QrCode,
  Utensils,
  Zap,
  Smartphone,
  ArrowRight,
  ScanLine,
  Keyboard,
} from 'lucide-angular';
import { PublicHeaderComponent } from '../../../food-venues/components/public-header/public-header.component';
import { NavigationService } from '../../../shared/services/navigation.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ContactUsLeadCard } from '../contact-us-lead/contact-us-lead-card';
import { FormsModule } from '@angular/forms';
import { QrProcessingService } from '../../../auth/services/qr-processing-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    PublicHeaderComponent,
    ContactUsLeadCard,
    FormsModule
  ],
  templateUrl: './home-component.html',
})
export class HomeComponent {
  private tableSession = inject(TableSessionService);
  private navigation = inject(NavigationService);
  private sweetAlert = inject(SweetAlertService);
  private qrProcessingService = inject(QrProcessingService);

  readonly QrCode = QrCode;
  readonly Utensils = Utensils;
  readonly Zap = Zap;
  readonly Smartphone = Smartphone;
  readonly ArrowRight = ArrowRight;
  readonly ScanLine = ScanLine;
  readonly Keyboard = Keyboard;
  
  manualTableCode: string = '';

  hasActiveSession = this.tableSession.hasActiveSession;

  sessionInfo = this.tableSession.tableSessionInfo;

  onScanQr() {
    this.navigation.navigateToScanner();
  }

  onManualSubmit() {
  const cleanCode = this.manualTableCode.trim().toLowerCase();
  this.qrProcessingService.processTableRequest({ shortCode: cleanCode });
}

  onFoodVenues() {
    this.navigation.navigateToFoodVenues();
  }

  async onContactUs() {
    const result = await this.sweetAlert.inputText(
      'Contacto comercial',
      'Dejanos tu número y te llamamos',
      'Ej: 11 2345 6789'
    );

    if (!result) return;

    console.log('Número de contacto:', result);
  }

  scrollTo(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
