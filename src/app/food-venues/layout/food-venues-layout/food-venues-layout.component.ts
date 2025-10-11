import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicHeaderComponent } from "../../components/public-header/public-header.component";

@Component({
  selector: 'app-food-venues-layout',
  imports: [RouterOutlet, PublicHeaderComponent],
  templateUrl: './food-venues-layout.component.html',
})
export class FoodVenuesLayoutComponent { }
