import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableSessionService } from '../../../services/table-session-service';
import { LucideAngularModule, UsersRound } from 'lucide-angular';
import { ParticipantsDropdownComponent } from '../../participants/participants-dropdown/participants-dropdown';

@Component({
  selector: 'app-table-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ParticipantsDropdownComponent],
  templateUrl: './table-summary.html',
})
export class TableSummaryComponent {
  private tableSession = inject(TableSessionService);

  tableNumber = computed(() => this.tableSession.tableSessionInfo().tableNumber);

  readonly UsersRound = UsersRound;
}
