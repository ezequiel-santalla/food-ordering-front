import { Routes } from "@angular/router";
import { AdminFrontLayout } from "./layout/admin-front-layout/admin-front-layout";
import { AdminHomePage } from "./pages/admin-home-page/admin-home-page";
import { ProductListPage } from "./pages/product-pages/product-list-page/product-list-page";
import { ProductFormPage } from "./pages/product-pages/product-form-page/product-form-page";
import { ProductDetailPage } from "./pages/product-pages/product-detail-page/product-detail-page";
import { CategoryListPage } from "./pages/category-pages/category-list-page/category-list-page";
import { CategoryFormPage } from "./pages/category-pages/category-form-page/category-form-page";
import { TagPage } from "./pages/tag-page/tag-page";
import { MyFoodVenuePage } from "./pages/my-food-venue-page/my-food-venue-page";
import { EmployeeListPage } from "./pages/employee-pages/employee-list-page/employee-list-page";
import { LoungeBuilderPage } from "./pages/lounge-pages/lounge-builder-page/lounge-builder-page";

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminFrontLayout,
    children: [
      {
        path: '',
        component: AdminHomePage,
      },

     {
      path: 'lounge',
      component: LoungeBuilderPage
     },


      {
        path: 'products',
        component: ProductListPage,
      },
      {
        path: 'products/add',
        component: ProductFormPage
      },
      {
        path: 'products/edit/:id',
        component: ProductFormPage
      },
      {
        path: 'products/:id',
        component: ProductDetailPage
      },


      {
        path: 'categories',
        component: CategoryListPage
      },
      {
        path: 'categories/add',
        component: CategoryFormPage
      },
      {
        path: 'categories/edit/:id',
        component: CategoryFormPage
      },


      {
        path: 'tags',
        component: TagPage
      },

      {
        path: 'employees',
        component: EmployeeListPage
      },

      {
        path: 'my-food-venue',
        component: MyFoodVenuePage
      }
    ],
  },


]
export default adminRoutes;
