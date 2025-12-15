import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Crown,
  UserMinus,
  UserRound,
  LucideAngularModule,
} from 'lucide-angular';

export type ParticipantLite = { publicId: string; nickname: string };

@Component({
  selector: 'app-participant-actions-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './participant-actions-modal.html',
})
export class ParticipantActionsModalComponent {
  readonly Crown = Crown;
  readonly UserMinus = UserMinus;
  readonly UserRound = UserRound;

  dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  participant = input<ParticipantLite | null>(null);
  amIHost = input(false);
  myParticipantId = input<string | null>(null);

  transferHost = output<ParticipantLite>();
  removeFromTable = output<ParticipantLite>();

  open() {
    this.dialog()?.nativeElement.showModal();
  }
  close() {
    this.dialog()?.nativeElement.close();
  }

  canAct() {
    const p = this.participant();
    return !!p && this.amIHost() && p.publicId !== this.myParticipantId();
  }

  clickTransferHost() {
    const p = this.participant();
    if (!p || !this.canAct()) return;
    this.transferHost.emit(p);
    this.close();
  }

  clickRemove() {
    const p = this.participant();
    if (!p || !this.canAct()) return;
    this.removeFromTable.emit(p);
    this.close();
  }
}
