import { Component } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';
import { AdminHeader } from "../../components/admin-header/admin-header";

@Component({
  selector: 'app-admin-front-layout',
  imports: [RouterOutlet, AdminDashboard, AdminHeader],
  templateUrl: './admin-front-layout.html'
})
export class AdminFrontLayout {

}
