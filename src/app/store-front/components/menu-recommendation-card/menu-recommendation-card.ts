import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../../models/menu.interface';

@Component({
  selector: 'app-menu-recommendation-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './menu-recommendation-card.html',
})
export class MenuRecommendationCard {
  @Input({ required: true }) product!: Product;

  select = output<Product>();
  add = output<Product>();

  onActionClick(event: Event) {
    event.stopPropagation();
    this.add.emit(this.product);
  }
}
