import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableSessionService } from '../../../services/table-session-service';
import { LucideAngularModule, UsersRound } from 'lucide-angular';

@Component({
  selector: 'app-table-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './table-summary.html',
})
export class TableSummaryComponent {
  private tableSession = inject(TableSessionService);

  tableNumber = computed(() => this.tableSession.tableSessionInfo().tableNumber);
  participantCount = computed(() => this.tableSession.tableSessionInfo().participantCount);
  tableCapacity = computed(() => this.tableSession.tableSessionInfo().tableCapacity ?? null);

  readonly UsersRound = UsersRound;
}
