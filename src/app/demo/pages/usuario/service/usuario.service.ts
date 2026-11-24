import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Usuario del sistema tal como lo devuelve el backend (sin contraseña). */
export interface UsuarioSistema {
  /** Identificador único del registro. */
  id: number;
  /** Nombre de usuario. */
  username: string;
  /** Rol del usuario. */
  rol: number;
  /** Perfil (rol) del usuario. */
  perfil: string;
  /** Correo electrónico. */
  email: string;
  /** Indica si el registro está activo. */
  activo: boolean;
  /** Fecha creación. */
  fechaCreacion: string;
}

/** Modelo de datos «Perfil» que se intercambia con el backend. */
export interface Perfil {
  /** Identificador de perfil. */
  perfilId: number;
  /** Nombre. */
  nombre: string;
  /** Indica si el registro está activo. */
  activo: boolean;
}

/** Datos para crear o actualizar: `rol` es el id del perfil; `password` es opcional al editar. */
export interface UsuarioRq {
  /** Identificador único del registro (opcional). */
  id?: number;
  /** Nombre de usuario. */
  username: string;
  /** Contraseña ingresada (nunca se guarda en el navegador) (opcional). */
  password?: string;
  /** Rol del usuario. */
  rol: number | null;
  /** Correo electrónico. */
  email: string;
  /** Indica si el registro está activo. */
  activo: boolean;
}

/** Servicio de usuario: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http = inject(HttpClient);
  /** Ruta del recurso en la API del backend. */
  private readonly api = environment.apiUrlAuth + '/usuario';

  /**
   * Lista usuario mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  listar(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(this.api + '/listar');
  }

  /**
   * Perfiles mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  perfiles(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(this.api + '/perfiles');
  }

  /**
   * Crea usuario mediante la API del backend.
   *
   * @param datos datos a enviar.
   * @returns observable con la respuesta del backend.
   */
  crear(datos: UsuarioRq): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.api + '/guardar', datos);
  }

  /**
   * Actualiza usuario mediante la API del backend.
   *
   * @param datos datos a enviar.
   * @returns observable con la respuesta del backend.
   */
  actualizar(datos: UsuarioRq): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.api + '/actualizar', datos);
  }
}
