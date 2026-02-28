import { Component, signal } from '@angular/core';
import { PaymentsPanelComponent } from '../../components/payment/payments-panel/payments-panel';
import { PaymentSummaryComponent } from '../../components/summary/payment-summary/payment-summary';
import { ActivatedRoute } from '@angular/router';

type PaymentsSection = 'history' | 'pending';

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [PaymentsPanelComponent, PaymentSummaryComponent],
  templateUrl: './payments-page.html',
})
export class PaymentsPageComponent {
  constructor(private route: ActivatedRoute) {}

  section = signal<PaymentsSection>('pending');
  highlightPaymentId = signal<string | null>(null);
  activeTab = signal<'pending' | 'history'>('pending');

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const rawSection = params.get('section');
      const highlight = params.get('highlight');

      const section: PaymentsSection =
        rawSection === 'history' || rawSection === 'pending'
          ? rawSection
          : 'pending';

      this.section.set(section);
      this.highlightPaymentId.set(highlight);

      if (highlight) {
        this.activeTab.set('history');
      } else {
        this.activeTab.set(section);
      }
    });
  }
}