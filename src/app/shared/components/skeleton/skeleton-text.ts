import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-text.html'
})
export class SkeletonTextComponent {
  width = input<string>('80px');
  height = input<string>('1rem');
}
