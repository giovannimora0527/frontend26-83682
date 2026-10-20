
/**
 * =====================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * MODELO DE HISTORIAS MÉDICAS
 * =====================================================
 *
 * Este modelo representa la información que
 * recibimos desde el backend Spring Boot.
 *
 * Tabla de MySQL: historia_medica
 */

export interface HistoriaMedica {

  // ==================================================
  // 1. IDENTIFICADOR DE LA HISTORIA MÉDICA
  // ==================================================

  // MySQL genera este ID automáticamente.
  id: number;

  // ==================================================
  // 2. IDENTIFICADOR DEL PACIENTE
  // ==================================================

  // Relaciona la historia médica con el paciente.
  pacienteId: number;

  // ==================================================
  // 3. FECHA DE CREACIÓN
  // ==================================================

  // Spring Boot devuelve las fechas en formato texto.
  // Puede ser null porque así está definida en MySQL.
  fechaCreacion: string | null;

}
