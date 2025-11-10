import { Routes } from "@angular/router";
import { EmployeeFrontLayout } from "./layout/employee-front-layout/employee-front-layout";
import { LoungePage } from "./pages/lounge-page/lounge-page";
import { OrderPage } from "./pages/order-page/order-page";
import { PaymentsPage } from "./pages/payments-page/payments-page";
import { ProductsPage } from "./pages/products-page/products-page";
import { ProfilePage } from "./pages/profile-page/profile-page";

export const employeesRoutes: Routes = [
{
      path: '',
      component: EmployeeFrontLayout,
      children: [
        {
          path: 'orders',
          component: OrderPage ,
        },
        {
          path: 'payments',
          component: PaymentsPage,
        },
        {
          path: '',
          component: LoungePage ,
        },
        {
          path: 'products',
          component: ProductsPage ,
        },
        {

          path: 'profile',
          component: ProfilePage ,
        }
                ]
}
]

export default employeesRoutes;
