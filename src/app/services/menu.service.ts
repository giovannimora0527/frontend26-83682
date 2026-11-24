import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Menu } from '../models/menu';

/** Servicio de menú: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class MenuService {
  /** URL base de la API del backend. */
  private readonly apiUrl = environment.apiUrlAuth + '/menu';

  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param http cliente HTTP de Angular.
   */
  constructor(private http: HttpClient) {}

  /**
   * Lista menús activos mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  listarMenusActivos() {
    return this.http.get<Menu[]>(this.apiUrl + '/listar-activos');
  }

  /**
   * Obtiene menús propios mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  obtenerMenusPropios() {
    return this.http.get<Menu[]>(this.apiUrl + '/propio').pipe(
      map(menus => menus.filter(menu => menu.activo).map(menu => ({
        ...menu,
        url: menu.code === 'historias' ? '/inicio/historias-medicas' : menu.url
      })))
    );
  }
}
