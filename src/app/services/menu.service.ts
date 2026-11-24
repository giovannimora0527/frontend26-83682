import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Menu } from '../models/menu';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly apiUrl = environment.apiUrlAuth + '/menu';

  constructor(private http: HttpClient) {}

  listarMenusActivos() {
    return this.http.get<Menu[]>(this.apiUrl + '/listar-activos');
  }

  obtenerMenusPropios() {
    return this.http.get<Menu[]>(this.apiUrl + '/propio').pipe(
      map(menus => menus.filter(menu => menu.activo).map(menu => ({
        ...menu,
        url: menu.code === 'historias' ? '/inicio/historias-medicas' : menu.url
      })))
    );
  }
}
