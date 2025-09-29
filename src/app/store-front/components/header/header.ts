import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Bell, User, QrCode, Search } from 'lucide-angular';

@Component({
  selector: 'app-header',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './header.html'
})
export class Header {
  readonly Bell = Bell;
  readonly User = User;
  readonly QrCode = QrCode;
  readonly Search = Search;

  categories = signal([
    { id: 'all', name: 'Todos', icon: '🍽️' },
    { id: 'burgers', name: 'Hamburguesas', icon: '🍔' },
    { id: 'drinks', name: 'Bebidas', icon: '🥤' },
    { id: 'desserts', name: 'Postres', icon: '🍰' },
    { id: 'sides', name: 'Acompañamientos', icon: '🍟' }
  ]);

  // Categoría seleccionada actualmente
  selectedCategory = signal('all');

  // Método para cambiar categoría
  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
    console.log('Categoría seleccionada:', categoryId);
    // Aquí emitirás un evento o actualizarás un servicio para filtrar productos
  }
}
