import { Component } from '@angular/core';
import { PaymentsPanelComponent } from '../../components/payment/payments-panel/payments-panel';
import { PaymenSummaryComponent } from '../../components/order-tabs/payment-summary/payment-summary';

@Component({
  selector: 'app-payments-page',
  imports: [PaymentsPanelComponent, PaymenSummaryComponent],
  templateUrl: './payments-page.html'
})
export class PaymentsPageComponent {

}