import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/** Raza tal como la devuelve el backend (GET /raza/listar). */
export interface RazaRegistro {
  /** Identificador de la raza. */
  razaId: number;
  /** Nombre de la raza. */
  nombre: string;
  /** Especie a la que pertenece (Canino, Felino…). */
  especie: string;
  /** Fecha de creación del registro. */
  fechaCreacion: string;
  /** Fecha de la última modificación, si existe. */
  fechaModificacion: string | null;
  /** Número de mascotas registradas con esta raza. */
  mascotas: number;
}

/** Datos para registrar o actualizar una raza. */
export interface RazaRq {
  /** Nombre de la raza (solo letras y espacios). */
  nombre: string;
  /** Especie (solo letras y espacios). */
  especie: string;
}

/** Servicio del catálogo de razas: consume los endpoints /raza del backend. */
@Injectable({ providedIn: 'root' })
export class RazaService {
  /** Cliente HTTP de Angular (el interceptor agrega el token). */
  private readonly http = inject(HttpClient);
  /** URL base del recurso. */
  private readonly base = `${environment.apiUrlAuth}/raza`;

  /**
   * Lista las razas con el número de mascotas de cada una.
   *
   * @returns observable con las razas.
   */
  listarRazas(): Observable<RazaRegistro[]> {
    return this.http.get<RazaRegistro[]>(`${this.base}/listar`);
  }

  /**
   * Registra una raza nueva.
   *
   * @param datos nombre y especie.
   * @returns observable con la raza creada.
   */
  crear(datos: RazaRq): Observable<RazaRegistro> {
    return this.http.post<RazaRegistro>(`${this.base}/guardar`, datos);
  }

  /**
   * Actualiza una raza (el backend impide cambiar la especie si ya tiene mascotas).
   *
   * @param id identificador de la raza.
   * @param datos nuevos datos.
   * @returns observable con la raza actualizada.
   */
  actualizar(id: number, datos: RazaRq): Observable<RazaRegistro> {
    return this.http.put<RazaRegistro>(`${this.base}/actualizar/${id}`, datos);
  }

  /**
   * Elimina una raza sin mascotas asociadas (solo administrador).
   *
   * @param id identificador de la raza.
   * @returns observable que finaliza al eliminar.
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/eliminar/${id}`);
  }
}
