/** Modelo de datos de una fórmula médica, equivalente al DTO de Spring. */
export interface FormulaMedica {
  id?: number;
  fechaCreacion?: string;
  medicamento: string;
  dosis: string;
  indicaciones: string;
  /** En la estructura base se reutiliza cantidad para representar duración en días. */
  cantidad: number;
  pacienteId: number;
  nombrePaciente?: string;
  /** Relaciones obligatorias con la atención clínica. */
  citaId: number;
  historiaMedicaId: number;
  veterinarioId: number;
  nombreVeterinario?: string;
  fechaEmision?: string;
  frecuencia: string;
  duracionDias?: number;
}
