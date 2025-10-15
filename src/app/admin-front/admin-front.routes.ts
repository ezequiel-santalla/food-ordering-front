import { Routes } from "@angular/router";
import { AdminFrontLayout } from "./layout/admin-front-layout/admin-front-layout";
import { AdminHomePage } from "./pages/admin-home-page/admin-home-page";
import { ProductListPage } from "./pages/product-pages/product-list-page/product-list-page";

export const adminRoutes: Routes = [
 {
    path: '',
    component: AdminFrontLayout,
    children: [
      {
        path: 'home',
        component: AdminHomePage,
      },
      {
        path: 'products',
        component: ProductListPage,
      },
    ],
  },


]
export default adminRoutes;
