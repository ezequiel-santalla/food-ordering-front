// live-metrics-bar.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Bell, ChefHat, LucideAngularModule, TrendingUp, UserCheck } from 'lucide-angular';
import { ShoppingCart, Users, DollarSign } from 'lucide-angular';
import { AnalyticsService } from '../../../services/analytics-service';

@Component({
  selector: 'app-live-metrics-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './live-metrics-bar.html',
})
export class LiveMetricsBar {

  private analyticsService = inject(AnalyticsService);

  readonly cartIcon = ShoppingCart;
  readonly usersIcon = Users;
  readonly dollarIcon = DollarSign;
  readonly chefHatIcon = ChefHat;
  readonly bellIcon = Bell;
  readonly trendingUpIcon = TrendingUp;
  readonly userCheckIcon = UserCheck;

  liveMetrics = rxResource({
    stream: () => this.analyticsService.getLiveMetrics()
  });
}
