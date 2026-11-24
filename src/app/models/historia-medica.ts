import { AnotacionHistoria } from './anotacion-historia';
import { FormulaMedica } from './formula-medica';

/**
 * Historia clínica: registro de una consulta (cita) de una mascota.
 * Relación: Cliente 1:N Mascota 1:N Historia clínica 1:N Anotación / Fórmula.
 */
export interface HistoriaMedica {
  id: number;
  pacienteId: number;
  mascotaId: number;
  mascota: string;
  clienteId: number;
  cliente: string;
  citaId: number | null;
  medicoId: number | null;
  veterinario: string | null;
  fecha: string;
  motivo: string | null;
  diagnostico: string | null;
  observaciones: string | null;
  estadoCita: string | null;
  estado: 'Activa' | 'Inactiva';
  activo: boolean;
  anotaciones: number;
  fechaCreacion: string | null;
  fechaModificacion: string | null;
}

/** Detalle de la historia con su histórico de anotaciones y sus fórmulas. */
export interface HistoriaDetalle extends HistoriaMedica {
  listaAnotaciones: AnotacionHistoria[];
  formulas: FormulaMedica[];
}

/** Datos para crear o actualizar una historia clínica. */
export interface HistoriaRq {
  clienteId: number | null;
  mascotaId: number | null;
  citaId: number | null;
  medicoId: number | null;
  fecha: string | null;
  motivo: string;
  diagnostico: string | null;
  observaciones: string | null;
  activo?: boolean;
}
