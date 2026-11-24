import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Medico } from '../models/medico';
import { environment } from '../../environments/environment';

/** Médico tal como lo devuelve el backend (GET /medico/listar). */
export interface MedicoRegistro {
  /** Identificador del médico. */
  id: number;
  /** Indica si el médico puede recibir citas. */
  activo: boolean;
  /** Tipo de documento (CC, CE, PA, PPT). */
  tipoDocumento: string;
  /** Número de documento. */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Teléfono de contacto. */
  telefono: string | null;
  /** Registro (tarjeta) profesional. */
  registroProfesional: string;
  /** Identificador de la especialidad. */
  especializacionId: number;
  /** Nombre de la especialidad. */
  especializacion: string;
  /** Indica si la especialidad está activa. */
  especializacionActiva: boolean;
  /** Usuario del sistema asociado (perfil Médico). */
  usuarioId: number | null;
  /** Nombre de usuario asociado. */
  usuario: string | null;
  /** Citas futuras pendientes, programadas o confirmadas. */
  citasFuturas: number;
  /** Total de citas del médico. */
  citasTotales: number;
}

/** Datos para registrar o actualizar un médico. */
export interface MedicoRq {
  /** Tipo de documento. */
  tipoDocumento: string;
  /** Número de documento. */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Teléfono (opcional). */
  telefono: string | null;
  /** Registro profesional. */
  registroProfesional: string;
  /** Especialidad. */
  especializacionId: number;
  /** Usuario asociado (opcional). */
  usuarioId: number | null;
  /** Estado. */
  activo: boolean;
}

/** Servicio del catálogo de médicos veterinarios: consume los endpoints /medico del backend. */
@Injectable({ providedIn: 'root' })
export class MedicoService {
  /** Cliente HTTP de Angular (el interceptor agrega el token). */
  private readonly http = inject(HttpClient);
  /** URL base del recurso. */
  private readonly base = `${environment.apiUrlAuth}/medico`;

  /**
   * Lista los médicos (modelo usado por citas, fórmulas e historias).
   *
   * @returns observable con los médicos.
   */
  listarMedicos(): Observable<Medico[]> {
    return this.http.get<Medico[]>(`${this.base}/listar`);
  }

  /**
   * Lista los médicos con especialidad, usuario y citas para la pantalla de gestión.
   *
   * @returns observable con los médicos.
   */
  listarRegistros(): Observable<MedicoRegistro[]> {
    return this.http.get<MedicoRegistro[]>(`${this.base}/listar`);
  }

  /**
   * Registra un médico.
   *
   * @param datos datos del médico.
   * @returns observable con el médico creado.
   */
  crear(datos: MedicoRq): Observable<MedicoRegistro> {
    return this.http.post<MedicoRegistro>(`${this.base}/crear`, datos);
  }

  /**
   * Actualiza un médico.
   *
   * @param id identificador del médico.
   * @param datos nuevos datos.
   * @returns observable con el médico actualizado.
   */
  actualizar(id: number, datos: MedicoRq): Observable<MedicoRegistro> {
    return this.http.put<MedicoRegistro>(`${this.base}/actualizar/${id}`, datos);
  }

  /**
   * Activa o inactiva un médico (no se puede inactivar con citas futuras reservadas).
   *
   * @param id identificador del médico.
   * @param activo nuevo estado.
   * @returns observable con el médico actualizado.
   */
  cambiarEstado(id: number, activo: boolean): Observable<MedicoRegistro> {
    return this.http.patch<MedicoRegistro>(`${this.base}/${id}/estado`, { activo });
  }
}
