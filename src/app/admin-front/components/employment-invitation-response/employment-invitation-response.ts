import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmploymentInvitationService } from '../../services/employment-invitation.service';

type PageState = 'pending' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-invitation-response',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employment-invitation-response.html',
})
export class EmploymentInvitationResponseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private invitationService = inject(EmploymentInvitationService);
  private router = inject(Router);

  public state = signal<PageState>('pending');
  public token = signal<string | null>(null);
  public errorMsg = signal<string>('');
  public successMsg = signal<string>('');

  public isPending = computed(() => this.state() === 'pending');
  public isLoading = computed(() => this.state() === 'loading');
  public isSuccess = computed(() => this.state() === 'success');
  public isError = computed(() => this.state() === 'error');

  ngOnInit(): void {
    const tokenFromUrl = this.route.snapshot.queryParamMap.get('token');

    if (tokenFromUrl) {
      this.token.set(tokenFromUrl);
      this.state.set('pending');
    } else {
      this.errorMsg.set('No se encontró un token de invitación en la URL.');
      this.state.set('error');
    }
  }

  respond(action: 'accept' | 'decline'): void {
    const currentToken = this.token();
    if (!currentToken) return;

    this.state.set('loading');
    this.errorMsg.set('');

    this.invitationService.respond(currentToken, action).subscribe({
      next: (response) => {
        this.successMsg.set(response.message);
        this.state.set('success');

        setTimeout(() => {
          this.goToLogin();
        }, 5000);
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message);
        this.state.set('error');
      },
    });
  }

  /**
   * Navega a la página de login, llamado por el botón o el temporizador.
   */
  public goToLogin(): void {

    this.router.navigate(['/auth/login']);
  }

   public goToHome(): void {

    this.router.navigate(['/food-vennues']);
  }
}
