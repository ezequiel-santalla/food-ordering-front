import { Component } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';

@Component({
  selector: 'app-admin-front-layout',
  imports: [RouterOutlet, AdminDashboard],
  templateUrl: './admin-front-layout.html'
})
export class AdminFrontLayout {

}
