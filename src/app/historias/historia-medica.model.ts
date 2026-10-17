import { AnotacionResumen } from './anotacion-resumen.model';

/**
 * Modelo (interface) que representa una Historia Medica, igual que la
 * HistoriaMedicaDTO del backend.
 */
export interface HistoriaMedica {
  /** Id de la historia medica. Es undefined cuando todavia no se ha guardado. */
  id?: number;

  /** Fecha de creacion. Si no se envia al crear, el backend la completa automaticamente. */
  fechaCreacion?: string;

  /** Diagnostico general registrado. */
  diagnostico: string;

  /** Observaciones adicionales. */
  observaciones: string;

  /** Id del paciente al que pertenece la historia medica. */
  pacienteId: number;

  /** Nombre del paciente (solo lo llena el backend al devolver la historia). */
  nombrePaciente?: string;
  clienteId?: number;
  nombreCliente?: string;
  citaId?: number;
  veterinarioId?: number;
  nombreVeterinario?: string;
  motivoConsulta?: string;

  /** Anotaciones asociadas a esta historia medica (solo lectura). */
  anotaciones?: AnotacionResumen[];
}
