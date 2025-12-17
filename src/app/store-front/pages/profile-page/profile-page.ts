import { Component, inject } from '@angular/core';
import { ProfileForm } from '../../components/profile-form/profile-form';
import { X, LucideAngularModule } from 'lucide-angular';
import { Location } from '@angular/common';
@Component({
  selector: 'app-profile-page',
  imports: [ProfileForm, LucideAngularModule],
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  readonly X = X;

  private location = inject(Location);

  onExit() {
    this.location.back();
  }
}
