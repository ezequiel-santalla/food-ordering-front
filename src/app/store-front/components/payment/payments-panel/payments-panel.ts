import {
  Component,
  effect,
  ElementRef,
  Input,
  signal,
  ViewChild,
} from '@angular/core';
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
    LucideAngularModule,
  ],
  templateUrl: './payments-panel.html',
})
export class PaymentsPanelComponent {
  @Input() activeSection: 'history' | 'pending' = 'pending';
  @Input() highlightPaymentId: string | null = null;
  @Input() set activeTab(val: 'pending' | 'history') {
    this._activeTab.set(val);
  }
  _activeTab = signal<'pending' | 'history'>('pending');

  @ViewChild('panelContent') panelContent?: ElementRef<HTMLDivElement>;
  @ViewChild(PendingPaymentsPanelComponent)
  pendingPanel?: PendingPaymentsPanelComponent;

  readonly Coins = Coins;
  readonly History = History;
}
