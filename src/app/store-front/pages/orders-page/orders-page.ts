import { Component } from '@angular/core';
import { OrderTabs } from '../../components/order-tabs/order-tabs';
import { TableSummaryComponent } from '../../components/order-tabs/table-summary/table-summary';

@Component({
  selector: 'app-orders-page',
  imports: [OrderTabs, TableSummaryComponent],
  templateUrl: './orders-page.html'
})
export class OrdersPage {

}
