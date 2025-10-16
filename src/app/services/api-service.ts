import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Objeto que contendrá todas las URLs finales, ya construidas.
  public readonly url;

  constructor() {
    // Al iniciar el servicio, construimos las URLs completas.
    this.url = this.buildApiUrls(API_ENDPOINTS);
  }

  /**
   * Función recursiva para construir el objeto de URLs completas.
   * Recorre el objeto API_ENDPOINTS y antepone el baseUrl a cada endpoint.
   * @param obj El objeto de endpoints a procesar.
   * @returns Un nuevo objeto con las URLs completas.
   */
  private buildApiUrls(obj: any): any {
    const result: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const fullPath = `${environment.baseUrl}`; // Base URL del entorno actual

        if (typeof value === 'string') {
          // Si es un string, simplemente combinamos.
          result[key] = `${fullPath}${value}`;
        } else if (typeof value === 'function') {
          // Si es una función, creamos una nueva función que llama a la original
          // y le antepone el baseUrl al resultado.
          result[key] = (...args: any[]) => {
            return `${fullPath}${value(...args)}`;
          };
        } else if (typeof value === 'object' && value !== null) {
          // Si es un objeto anidado, llamamos a la función de forma recursiva.
          result[key] = this.buildApiUrls(value);
        }
      }
    }
    return result;
  }
}