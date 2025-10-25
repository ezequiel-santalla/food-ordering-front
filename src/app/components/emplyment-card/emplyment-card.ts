import { Component } from '@angular/core';
import { Briefcase, ChefHat, ShieldAlert, ShieldCheck, User } from 'lucide-angular';

@Component({
  selector: 'app-emplyment-card',
  imports: [],
  templateUrl: './emplyment-card.html',
  styleUrl: './emplyment-card.css'
})
export class EmplymentCard {

  // Expone los íconos a la plantilla para que puedan ser usados con [img]
  protected readonly User = User;
  protected readonly Briefcase = Briefcase;
  protected readonly ChefHat = ChefHat;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly ShieldAlert = ShieldAlert;

  // ... tu lógica de signals y employments

  // Función para obtener el ícono y el color según el rol
  public getIconForRole(role: string): { icon: any, colorClass: string } {
    switch (role) {
      case 'ROLE_STAFF':
        return { icon: this.ChefHat, colorClass: 'text-success' };
      case 'ROLE_MANAGER':
        return { icon: this.Briefcase, colorClass: 'text-info' };
      case 'ROLE_ADMIN':
        return { icon: this.ShieldCheck, colorClass: 'text-warning' };
      case 'ROLE_ROOT':
        return { icon: this.ShieldAlert, colorClass: 'text-error' };
      default:
        return { icon: this.User, colorClass: 'text-accent' };
    }
  }
}