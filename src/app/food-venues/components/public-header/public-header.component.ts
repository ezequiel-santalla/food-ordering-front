import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink],
  templateUrl: './public-header.component.html',
})
export class PublicHeaderComponent {

  tableSessionId = localStorage.getItem('tableSessionId');

  isLoggedIn(): boolean {
    return !!this.tableSessionId;
  }
}
