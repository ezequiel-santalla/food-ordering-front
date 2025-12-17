import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableSessionService } from '../../../services/table-session-service';
import {
  LucideAngularModule,
  User,
  UserMinus,
  Clock,
  UsersRound,
  Crown,
  UserRound,
} from 'lucide-angular';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { viewChild } from '@angular/core';
import {
  ParticipantActionsModalComponent,
  ParticipantLite,
} from '../participant-actions-modal/participant-actions-modal';

@Component({
  selector: 'app-participants-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ParticipantActionsModalComponent,
  ],
  templateUrl: './participants-dropdown.html',
})
export class ParticipantsDropdownComponent {
  private tableSession = inject(TableSessionService);
  private sweetAlert = inject(SweetAlertService);

  participantModal =
    viewChild<ParticipantActionsModalComponent>('participantModal');

  selectedParticipant: ParticipantLite | null = null;

  readonly User = User;
  readonly UserMinus = UserMinus;
  readonly Clock = Clock;
  readonly UsersRound = UsersRound;
  readonly UserRound = UserRound;

  readonly Crown = Crown;

  isLoading = computed(() => this.tableSession.isLoading());

  participantCount = computed(
    () => this.tableSession.tableSessionInfo().participantCount
  );
  tableCapacity = computed(
    () => this.tableSession.tableSessionInfo().tableCapacity
  );
  activeParticipants = computed(
    () => this.tableSession.tableSessionInfo().activeParticipants || []
  );
  previousParticipants = computed(
    () => this.tableSession.tableSessionInfo().previousParticipants || []
  );
  myParticipantId = computed(
    () => this.tableSession.tableSessionInfo().participantId
  );
  hostParticipantId = computed(
    () => this.tableSession.tableSessionInfo().hostParticipantId
  );
  amIHost = computed(() => this.myParticipantId() === this.hostParticipantId());

  sortedParticipants = computed(() => {
    const all = this.tableSession.tableSessionInfo().activeParticipants || [];
    const myId = this.myParticipantId();

    if (!myId) return all;

    const me = all.find((p) => p.publicId === myId);
    const others = all.filter((p) => p.publicId !== myId);

    return me ? [me, ...others] : all;
  });

   openParticipantActions(user: any) {
    this.selectedParticipant = {
      publicId: user.publicId,
      nickname: user.nickname,
    };

    this.participantModal()?.open();
  }

  getInitials(nickname: string): string {
    if (!nickname) return '?';
    return nickname.substring(0, 2).toUpperCase();
  }

  onTransferHost(targetUser: any) {
    this.sweetAlert
      .confirm(
        '¿Ceder Anfitrión?',
        `¿Estás seguro que quieres nombrar a ${targetUser.nickname} como el nuevo anfitrión? Perderás tus privilegios de control.`,
        'Sí, ceder cargo'
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.tableSession
            .delegateHostingDuties(targetUser.publicId)
            .subscribe({
              next: () => {},
              error: (err) => {
                console.error(err);
                this.sweetAlert.showError(
                  'Error',
                  'No se pudo transferir el cargo.'
                );
              },
            });
        }
      });
  }

  onRemoveFromTable(targetUser: any) {
  this.sweetAlert.confirm(
    'Quitar de la mesa',
    `¿Deseás quitar a ${targetUser.nickname} de la mesa?`,
    'Quitar'
  ).then(() => {
    console.log('Quitar de la mesa:', targetUser);
    // futura lógica real
  });
}

}
