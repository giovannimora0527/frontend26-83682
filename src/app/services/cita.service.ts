import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Cita con los nombres de cliente, mascota y veterinario (respuesta del backend). */
export interface CitaDetalle {
  id: number;
  clienteId: number;
  mascotaId: number;
  medicoId: number;
  fechaHora: string;
  fechaFin: string;
  estado: string;
  motivo: string | null;
  cliente: string;
  mascota: string;
  veterinario: string;
  historiaId: number | null;
}

/** Mascota de un cliente (combo dependiente cliente → mascota). */
export interface MascotaCliente {
  mascotaId: number;
  nombreMascota: string;
  edad: number;
  raza: string;
  especie: string;
  clienteId: number;
}

/**
 * Consultas de citas y combos dependientes (cliente → mascotas → citas) reutilizadas por varias pantallas.
 */
@Injectable({ providedIn: 'root' })
export class CitaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrlAuth;

  /** Citas entre dos fechas (opcionales), de la más reciente a la más antigua. */
  listarRango(fechaInicio?: string, fechaFin?: string): Observable<CitaDetalle[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<CitaDetalle[]>(`${this.base}/cita/listar-rango`, { params });
  }

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
