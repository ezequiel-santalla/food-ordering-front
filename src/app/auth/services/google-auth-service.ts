import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {

  initialize(callback: (idToken: string) => void): void {
    if (typeof google === 'undefined') {
      console.error('Google script no está cargado');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => callback(response.credential),
    });
  }

  prompt(): void {
    if (typeof google === 'undefined') return;
    google.accounts.id.prompt();
  }
}
