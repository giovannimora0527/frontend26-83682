/**
 * Modelo (interface) que representa una Cita, igual que la CitaDTO del
 * backend en Spring Boot.
 */
export interface Cita {
  /** Id de la cita. Es undefined cuando todavia no se ha guardado. */
  id?: number;

  /** Fecha y hora de la cita, en formato ISO (ej: "2026-10-05T09:00:00"). */
  fecha: string;

  /** Motivo de la consulta. */
  motivo: string;

  /** Estado de la cita: PENDIENTE, CONFIRMADA, COMPLETADA o CANCELADA. */
  estado: string;

  /** Id del paciente (mascota) al que pertenece la cita. */
  pacienteId: number;

  /** Nombre del paciente. Solo lo llena el backend al devolver la cita, no se envia. */
  nombrePaciente?: string;
  /** Cliente propietario y veterinario asignado a la cita. */
  clienteId?: number;
  nombreCliente?: string;
  veterinarioId: number;
  nombreVeterinario?: string;
}
