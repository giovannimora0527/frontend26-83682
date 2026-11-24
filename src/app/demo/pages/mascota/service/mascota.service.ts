import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Mascota } from 'src/app/models/mascota';
import { environment } from 'src/environments/environment';

/** Datos para registrar una mascota. */
export interface CrearMascotaDTO {
  /** Nombre de la mascota. */
  nombreMascota: string;
  /** Edad en años (0 a 40). */
  edad: number;
  /** Raza. */
  razaId: number;
  /** Propietario. */
  clienteId: number;
}

/** Datos para actualizar una mascota (incluye el estado). */
export interface MascotaRq extends CrearMascotaDTO {
  /** Indica si la mascota está activa. */
  activo: boolean;
}

/** Mascota con raza, propietario y conteos de citas e historias (GET /mascota/listar-detalle). */
export interface MascotaDetalle {
  /** Identificador de la mascota. */
  mascotaId: number;
  /** Nombre. */
  nombreMascota: string;
  /** Edad en años. */
  edad: number;
  /** Indica si está activa. */
  activo: boolean | number;
  /** Fecha de registro. */
  fechaRegistro: string;
  /** Fecha de la última modificación. */
  fechaModificacion: string | null;
  /** Identificador de la raza. */
  razaId: number;
  /** Identificador del propietario. */
  clienteId: number;
  /** Citas futuras reservadas. */
  citasFuturas: number;
  /** Total de citas. */
  citasTotales: number;
  /** Historias clínicas registradas. */
  historias: number;
  /** Raza y especie. */
  raza: { razaId: number; nombre: string; especie: string };
  /** Propietario. */
  cliente: { clienteId: number; tipoDocumento: string; numeroDocumento: string; nombres: string; apellidos: string;
    telefono: string | null; activo: boolean | number };
}

/** Servicio de mascotas (pacientes): consume los endpoints /mascota del backend. */
@Injectable({ providedIn: 'root' })
export class MascotaService {
  /** Cliente HTTP de Angular (el interceptor agrega el token). */
  private readonly http = inject(HttpClient);
  /** URL base del recurso. */
  private readonly base = `${environment.apiUrlAuth}/mascota`;

  /**
   * Lista las mascotas con raza y propietario (modelo usado por citas y otros módulos).
   *
   * @returns observable con las mascotas.
   */
  listarMascotas(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(`${this.base}/listar-detalle`);
  }

  /**
   * Lista las mascotas con conteos de citas e historias para la pantalla de gestión.
   *
   * @returns observable con las mascotas.
   */
  listarDetalle(): Observable<MascotaDetalle[]> {
    return this.http.get<MascotaDetalle[]>(`${this.base}/listar-detalle`);
  }

  /**
   * Registra una mascota.
   *
   * @param datos datos de la mascota.
   * @returns observable con la mascota creada.
   */
  crearMascota(datos: CrearMascotaDTO): Observable<MascotaDetalle> {
    return this.http.post<MascotaDetalle>(`${this.base}/crear`, datos);
  }

  /**
   * Actualiza una mascota.
   *
   * @param id identificador de la mascota.
   * @param datos nuevos datos.
   * @returns observable con la mascota actualizada.
   */
  actualizar(id: number, datos: MascotaRq): Observable<MascotaDetalle> {
    return this.http.put<MascotaDetalle>(`${this.base}/actualizar/${id}`, datos);
  }

  /**
   * Activa o inactiva una mascota (no se inactiva con citas futuras reservadas).
   *
   * @param id identificador de la mascota.
   * @param activo nuevo estado.
   * @returns observable con la mascota actualizada.
   */
  cambiarEstado(id: number, activo: boolean): Observable<MascotaDetalle> {
    return this.http.patch<MascotaDetalle>(`${this.base}/${id}/estado`, { activo });
  }
}
