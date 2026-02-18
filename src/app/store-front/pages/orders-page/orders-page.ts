import { Component } from '@angular/core';
import { OrderTabs } from '../../components/order/order-tabs/order-tabs';
import { TableSummaryComponent } from '../../components/summary/table-summary/table-summary';

@Component({
  selector: 'app-orders-page',
  imports: [OrderTabs, TableSummaryComponent],
  templateUrl: './orders-page.html'
})
export class OrdersPage {

}
