import { AnotacionHistoria } from './anotacion-historia';
import { FormulaMedica } from './formula-medica';

/**
 * Historia clínica: registro de una consulta (cita) de una mascota.
 * Relación: Cliente 1:N Mascota 1:N Historia clínica 1:N Anotación / Fórmula.
 */
export interface HistoriaMedica {
  /** Identificador único del registro. */
  id: number;
  /** Identificador de paciente. */
  pacienteId: number;
  /** Identificador de mascota. */
  mascotaId: number;
  /** Mascota. */
  mascota: string;
  /** Identificador de cliente. */
  clienteId: number;
  /** Cliente. */
  cliente: string;
  /** Identificador de cita. */
  citaId: number | null;
  /** Identificador de médico. */
  medicoId: number | null;
  /** Veterinario. */
  veterinario: string | null;
  /** Fecha (AAAA-MM-DD). */
  fecha: string;
  /** Motivo registrado. */
  motivo: string | null;
  /** Diagnóstico clínico. */
  diagnostico: string | null;
  /** Observaciones adicionales. */
  observaciones: string | null;
  /** Estado cita. */
  estadoCita: string | null;
  /** Estado actual del registro. */
  estado: 'Activa' | 'Inactiva';
  /** Indica si el registro está activo. */
  activo: boolean;
  /** Anotaciones. */
  anotaciones: number;
  /** Fecha creación. */
  fechaCreacion: string | null;
  /** Fecha modificación. */
  fechaModificacion: string | null;
}

/** Detalle de la historia con su histórico de anotaciones y sus fórmulas. */
export interface HistoriaDetalle extends HistoriaMedica {
  /** Lista anotaciones. */
  listaAnotaciones: AnotacionHistoria[];
  /** Formulario reactivo: fórmulas. */
  formulas: FormulaMedica[];
}

/** Datos para crear o actualizar una historia clínica. */
export interface HistoriaRq {
  /** Identificador de cliente. */
  clienteId: number | null;
  /** Identificador de mascota. */
  mascotaId: number | null;
  /** Identificador de cita. */
  citaId: number | null;
  /** Identificador de médico. */
  medicoId: number | null;
  /** Fecha (AAAA-MM-DD). */
  fecha: string | null;
  /** Motivo registrado. */
  motivo: string;
  /** Diagnóstico clínico. */
  diagnostico: string | null;
  /** Observaciones adicionales. */
  observaciones: string | null;
  /** Indica si el registro está activo (opcional). */
  activo?: boolean;
}
