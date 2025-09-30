import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  menu = signal([
    {
      id: 1,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Clásica',
      description: 'Deliciosa hamburguesa con queso cheddar, lechuga y tomate fresco',
      price: 12.99
    },
    {
      id: 2,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa BBQ',
      description: 'Con salsa BBQ casera, cebolla caramelizada y tocino crujiente',
      price: 14.99
    },
    {
      id: 3,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Vegana',
      description: 'Hecha con proteína vegetal, aguacate y vegetales frescos',
      price: 13.99
    },
    {
      id: 4,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Doble Queso',
      description: 'Con doble carne y doble queso cheddar derretido',
      price: 15.99
    },
    {
      id: 5,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Picante',
      description: 'Con jalapeños, salsa picante y queso pepper jack',
      price: 14.49
    },
    {
      id: 6,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Mediterránea',
      description: 'Con queso feta, aceitunas negras y salsa tzatziki',
      price: 13.49
    },
    {
      id: 7,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Criolla',
      description: 'Con huevo frito, jamón y papas pay',
      price: 15.49
    },
    {
      id: 8,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Tex-Mex',
      description: 'Con guacamole, nachos y salsa mexicana',
      price: 14.99
    },
    {
      id: 9,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Capresse',
      description: 'Con mozzarella fresca, tomate y albahaca',
      price: 13.49
    },
    {
      id: 10,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Ranchera',
      description: 'Con cebolla crujiente, salsa ranch y bacon',
      price: 14.79
    },
    {
      id: 11,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Premium',
      description: 'Con carne Angus, queso brie y cebolla caramelizada',
      price: 16.99
    },
    {
      id: 12,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Hawaiana',
      description: 'Con piña grillada, queso suizo y salsa teriyaki',
      price: 14.29
    },
    {
      id: 13,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Gourmet',
      description: 'Con rúcula, queso azul y reducción de balsámico',
      price: 15.89
    },
    {
      id: 14,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Italiana',
      description: 'Con pesto, mozzarella y tomate seco',
      price: 14.59
    },
    {
      id: 15,
      image: 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp',
      name: 'Hamburguesa Suprema',
      description: 'Triple carne, triple queso y todos los toppings',
      price: 18.99
    }
  ]);

  getMenu() {
    return this.menu();
  }

  getMenuItem(id: number) {
    return this.menu().find(item => item.id === id);
  }
}
