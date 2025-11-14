import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "../../components/header/header";
import { Footer } from "../../components/footer/footer";

@Component({
  selector: 'app-store-front-layout',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './store-front-layout.html',
})
export class StoreFrontLayoutComponent { }
