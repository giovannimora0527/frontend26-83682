import { Cliente } from './cliente';
import { EstadoCita } from './estados';
import { Mascota } from './mascota';
import { Medico } from './medico';

/** Servicio como viene anidado en la cita. */
export interface ServicioCita {
  id: number;
  codigo?: string;
  nombre: string;
  duracionMinutos: number;
  activo?: boolean;
}

export class Cita {
  id?: number;
  cliente?: Cliente;
  mascota?: Mascota;
  medico?: Medico;
  servicio?: ServicioCita | null;
  fechaInicio!: Date | string;
  fechaFin?: Date | string;
  /** Alias de solo lectura de fechaInicio. */
  fechaHora?: Date | string;
  estado!: string;
  motivo!: string | null;
  motivoCancelacion?: string | null;
}

export interface CitaRq {
  id?: number;
  mascotaId: number;
  medicoId: number;
  fechaInicio: string;
  motivo: string;
  servicioId?: number;
  clienteId?: number;
  estado?: EstadoCita;
}

export interface HistorialEstadoCita {
  id: number;
  estadoAnterior: EstadoCita | null;
  estadoNuevo: EstadoCita;
  fechaInicioAnterior: string | null;
  fechaInicioNueva: string | null;
  motivo: string | null;
  usuario: string;
  fecha: string;
}
