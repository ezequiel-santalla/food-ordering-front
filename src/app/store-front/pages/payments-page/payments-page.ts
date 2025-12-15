import { Component } from '@angular/core';
import { PaymentsPanelComponent } from '../../components/payment/payments-panel/payments-panel';
import { PaymentSummaryComponent } from '../../components/order-tabs/payment-summary/payment-summary';

@Component({
  selector: 'app-payments-page',
  imports: [PaymentsPanelComponent, PaymentSummaryComponent],
  templateUrl: './payments-page.html'
})
export class PaymentsPageComponent {

}