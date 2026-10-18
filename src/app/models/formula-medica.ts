
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * MODELO DE FÓRMULAS MÉDICAS
 * ==========================================================
 *
 * Representa los datos recibidos desde
 * el backend Spring Boot.
 *
 * Tabla MySQL: formula_medica
 */

// ==========================================================
// INTERFAZ DE FÓRMULAS MÉDICAS
// ==========================================================

export interface FormulaMedica {

  // Identificador único de la fórmula.
  id: number;

  // Identificador de la cita médica.
  citaId: number;

  // Identificador del medicamento formulado.
  medicamentoId: number;

  // Cantidad y frecuencia del medicamento.
  dosis: string;

  // Recomendaciones de administración.
  indicaciones: string | null;

  // Fecha y hora de creación del registro.
  fechaCreacionRegistro: string;

  // Fecha de última actualización.
  // Puede ser nula si no se ha modificado.
  fechaActualizacionRegistro: string | null;

}
