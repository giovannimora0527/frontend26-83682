import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/** Tarjeta de pendientes del tablero (GET /tablero/pendientes). */
export interface Pendiente {
  /** Identificador de la tarjeta. */
  clave: string;
  /** Título visible. */
  titulo: string;
  /** Explicación del pendiente y del siguiente paso del flujo. */
  descripcion: string;
  /** Número de registros pendientes. */
  cantidad: number;
  /** Pantalla donde se resuelve (null si el perfil solo consulta). */
  url: string | null;
  /** accion, aviso o info (define el color). */
  nivel: 'accion' | 'aviso' | 'info';
}

/** Servicio del tablero de pendientes: muestra a cada perfil el trabajo que le entregó el paso anterior. */
@Injectable({ providedIn: 'root' })
export class TableroService {
  /** Cliente HTTP de Angular (el interceptor agrega el token). */
  private readonly http = inject(HttpClient);

  /**
   * Pendientes del usuario autenticado según su perfil.
   *
   * @returns observable con las tarjetas.
   */
  pendientes(): Observable<Pendiente[]> {
    return this.http.get<Pendiente[]>(`${environment.apiUrlAuth}/tablero/pendientes`);
  }
}
