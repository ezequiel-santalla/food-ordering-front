import { Routes } from "@angular/router";
import { MenuPage } from "./pages/menu-page/menu-page";
import { MenuItemPage } from "./pages/menu-item-page/menu-item-page";

export const Menu: Routes = [
  {
    path: '',
    component: MenuPage
  },
  {
    path: ':id',
    component: MenuItemPage
  }
];
