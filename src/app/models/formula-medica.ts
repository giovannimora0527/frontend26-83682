/**
 * Modelo de una fórmula médica.
 * Representa los datos recibidos desde Spring Boot.
 */
export interface FormulaMedica {

  // Identificador de la fórmula.
  id: number;

  // Cita médica relacionada.
  citaId: number;

  // Medicamento recetado.
  medicamentoId: number;

  // Cantidad o dosis del medicamento.
  dosis: string;

  // Frecuencia de administración.
  frecuencia: string | null;

  // Duración del tratamiento.
  duracionTratamiento: string | null;

  // Recomendaciones del médico.
  indicaciones: string | null;

  // Fecha en que se emite la fórmula.
  fechaEmision: string | null;

  // Fecha de creación del registro.
  fechaCreacionRegistro: string;

  // Última actualización.
  fechaActualizacionRegistro: string | null;
}
