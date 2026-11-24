import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Cita con los nombres de cliente, mascota y veterinario (respuesta del backend). */
export interface CitaDetalle {
  /** Identificador único del registro. */
  id: number;
  /** Identificador de cliente. */
  clienteId: number;
  /** Identificador de mascota. */
  mascotaId: number;
  /** Identificador de médico. */
  medicoId: number;
  /** Fecha y hora (AAAA-MM-DDTHH:MM). */
  fechaHora: string;
  /** Fecha fin. */
  fechaFin: string;
  /** Estado actual del registro. */
  estado: string;
  /** Motivo registrado. */
  motivo: string | null;
  /** Cliente. */
  cliente: string;
  /** Mascota. */
  mascota: string;
  /** Veterinario. */
  veterinario: string;
  /** Identificador de historia. */
  historiaId: number | null;
}

/** Mascota de un cliente (combo dependiente cliente → mascota). */
export interface MascotaCliente {
  /** Identificador de mascota. */
  mascotaId: number;
  /** Nombre mascota. */
  nombreMascota: string;
  /** Edad de la mascota en años. */
  edad: number;
  /** Raza. */
  raza: string;
  /** Especie de la mascota. */
  especie: string;
  /** Identificador de cliente. */
  clienteId: number;
}

/**
 * Consultas de citas y combos dependientes (cliente → mascotas → citas) reutilizadas por varias pantallas.
 */
@Injectable({ providedIn: 'root' })
export class CitaService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http = inject(HttpClient);
  /** URL base de la API del backend. */
  private readonly base = environment.apiUrlAuth;

  /** Citas entre dos fechas (opcionales), de la más reciente a la más antigua. */
  listarRango(fechaInicio?: string, fechaFin?: string): Observable<CitaDetalle[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<CitaDetalle[]>(`${this.base}/cita/listar-rango`, { params });
  }

  /**
   * Consulta cita mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  consultar(id: number): Observable<CitaDetalle> {
    return this.http.get<CitaDetalle>(`${this.base}/cita/${id}`);
  }

  /** Citas de una mascota (combo dependiente mascota → cita). */
  porMascota(mascotaId: number): Observable<CitaDetalle[]> {
    return this.http.get<CitaDetalle[]>(`${this.base}/cita/por-mascota/${mascotaId}`);
  }

  /** Mascotas activas de un cliente (combo dependiente cliente → mascota). */
  mascotasDeCliente(clienteId: number): Observable<MascotaCliente[]> {
    return this.http.get<MascotaCliente[]>(`${this.base}/cliente/${clienteId}/mascotas`);
  }

  /** Reactiva una cita cancelada en el horario indicado. */
  reactivar(id: number, inicio: string, fin: string): Observable<CitaDetalle> {
    return this.http.post<CitaDetalle>(`${this.base}/cita/${id}/reactivar`, { inicio, fin });
  }
}
