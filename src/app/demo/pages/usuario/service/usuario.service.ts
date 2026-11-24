import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Usuario del sistema tal como lo devuelve el backend (sin contraseña). */
export interface UsuarioSistema {
  id: number;
  username: string;
  rol: number;
  perfil: string;
  email: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface Perfil {
  perfilId: number;
  nombre: string;
  activo: boolean;
}

/** Datos para crear o actualizar: `rol` es el id del perfil; `password` es opcional al editar. */
export interface UsuarioRq {
  id?: number;
  username: string;
  password?: string;
  rol: number | null;
  email: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrlAuth + '/usuario';

  listar(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(this.api + '/listar');
  }

  perfiles(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(this.api + '/perfiles');
  }

  crear(datos: UsuarioRq): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.api + '/guardar', datos);
  }

  actualizar(datos: UsuarioRq): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.api + '/actualizar', datos);
  }
}
