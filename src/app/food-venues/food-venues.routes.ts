import { Routes } from "@angular/router";
import { FoodVenuesLayoutComponent } from "./layout/food-venues-layout/food-venues-layout.component";
import { FoodVenuesListPageComponent } from "./pages/food-venues-list-page/food-venues-list-page.component";
import { FoodVenueMenuPageComponent } from "./pages/food-venue-menu-page/food-venue-menu-page.component";

export const foodVenuesRoutes: Routes = [
  {
    path: '',
    component: FoodVenuesLayoutComponent,
    children: [
      {
        path: '',
        component: FoodVenuesListPageComponent,
      },
      {
        path: ':id/menu',
        component: FoodVenueMenuPageComponent,
      },
    ],
  },
];

export default foodVenuesRoutes;
