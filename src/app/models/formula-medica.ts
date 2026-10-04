/**
 * Representa una fórmula médica registrada en el sistema.
 */
export interface FormulaMedica {
  id?: number;
  dosis: string;
  indicaciones: string;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  medicamento: string;
  paciente: string;
  medico: string;
}

/**
 * Campos que se envían al crear o actualizar una fórmula médica.
 */
export type FormulaMedicaPayload = Omit<FormulaMedica, 'id'>;
