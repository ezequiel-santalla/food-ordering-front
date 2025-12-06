import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentHistoryPanelComponent } from '../payments-history-panel/payments-history-panel';
import { PendingPaymentsPanelComponent } from '../pending-payments-panel/pending-payments-panel';
import { Coins, History, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-payments-panel',
  standalone: true,
  imports: [
    CommonModule,
    PaymentHistoryPanelComponent,
    PendingPaymentsPanelComponent,
    LucideAngularModule
],
  templateUrl: './payments-panel.html'
})
export class PaymentsPanelComponent {

  readonly Coins= Coins;
  readonly History= History;

  activeTab = signal<'pending' | 'history'>('pending');

  setTab(tab: 'pending' | 'history') {
    this.activeTab.set(tab);
  }
}
