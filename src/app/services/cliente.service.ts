import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Cliente } from '../models/cliente';
import { environment } from '../../environments/environment';

/** Datos para registrar o actualizar un cliente (propietario). */
export interface ClienteRq {
  /** Tipo de documento (CC, TI, CE, PA, NIT, PPT). */
  tipoDocumento: string;
  /** Número de documento. */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Fecha de nacimiento (AAAA-MM-DD). */
  fechaNacimiento: string;
  /** Género: M, F u O (opcional). */
  genero: string | null;
  /** Teléfono (opcional). */
  telefono: string | null;
  /** Dirección (opcional). */
  direccion: string | null;
}

/** Mascota activa de un cliente (GET /cliente/{id}/mascotas). */
export interface MascotaDeCliente {
  /** Identificador de la mascota. */
  mascotaId: number;
  /** Nombre. */
  nombreMascota: string;
  /** Edad en años. */
  edad: number;
  /** Raza. */
  raza: string;
  /** Especie. */
  especie: string;
}

/** Servicio de clientes (propietarios): consume los endpoints /cliente del backend. */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  /** Cliente HTTP de Angular (el interceptor agrega el token). */
  private readonly http = inject(HttpClient);
  /** URL base del recurso. */
  private readonly base = `${environment.apiUrlAuth}/cliente`;

  /**
   * Lista todos los clientes (activos primero).
   *
   * @returns observable con los clientes.
   */
  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.base}/listar-todos`);
  }

  /**
   * Consulta un cliente.
   *
   * @param id identificador del cliente.
   * @returns observable con el cliente.
   */
  consultar(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  /**
   * Mascotas activas del cliente.
   *
   * @param id identificador del cliente.
   * @returns observable con las mascotas.
   */
  mascotas(id: number): Observable<MascotaDeCliente[]> {
    return this.http.get<MascotaDeCliente[]>(`${this.base}/${id}/mascotas`);
  }

  /**
   * Registra (sin id) o actualiza (con id) un cliente.
   *
   * @param datos datos del cliente.
   * @param id identificador si se actualiza.
   * @returns observable con el cliente guardado.
   */
  guardar(datos: ClienteRq, id?: number): Observable<Cliente> {
    return id ? this.http.put<Cliente>(`${this.base}/${id}`, datos) : this.http.post<Cliente>(this.base, datos);
  }

  /**
   * Archiva un cliente y sus mascotas (no se permite con citas futuras reservadas).
   *
   * @param id identificador del cliente.
   * @returns observable que finaliza al archivar.
   */
  archivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Reactiva un cliente archivado.
   *
   * @param id identificador del cliente.
   * @returns observable con el cliente reactivado.
   */
  reactivar(id: number): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.base}/${id}/reactivar`, {});
  }
}
