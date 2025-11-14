import { Component, inject } from '@angular/core';
import { ProfileForm } from '../../components/profile-form/profile-form';
import { X, LucideAngularModule } from 'lucide-angular';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-profile-page',
  imports: [ProfileForm, LucideAngularModule],
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  readonly X = X;

  private navigation = inject(NavigationService);

  onExit() {
    this.navigation.navigateBySessionState();
  }
}
