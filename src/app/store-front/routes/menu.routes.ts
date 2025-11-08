import { Routes } from "@angular/router";
import { MenuItemPage } from "../pages/menu-item-page/menu-item-page";

export const Menu: Routes = [
  {
    path: '',
    component: MenuItemPage
  },
  {
    path: ':name',
    component: MenuItemPage
  }
];
