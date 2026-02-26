import { CommonModule } from '@angular/common';
import { Component, input, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import {
  DollarSign,
  ClipboardList,
  Clock,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-angular';
import { DateRange } from '../../../models/analytics';
import { AnalyticsService } from '../../../services/analytics-service';
import { interval, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-metrics-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './metrics-card.html'
})
export class MetricsCard {

  private analyticsService = inject(AnalyticsService);

  dateRange = input.required<DateRange>();

  readonly trendingUpIcon = TrendingUp;
  readonly trendingDownIcon = TrendingDown;
  readonly dollarSignIcon = DollarSign;
  readonly clipboardIcon = ClipboardList;
  readonly usersIcon = Users;
  readonly clockIcon = Clock;

  analyticsData = rxResource({
    params: () => this.dateRange(),
    stream: ({ params }) => interval(30000).pipe(
      startWith(0),
      switchMap(() => this.analyticsService.getAnalyticsCards(params))
    )
  });
}
