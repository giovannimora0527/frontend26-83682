
/**
 * =====================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * MODELO DE ANOTACIONES DE HISTORIAS MÉDICAS
 * =====================================================
 *
 * Este modelo representa los datos recibidos
 * desde Spring Boot.
 *
 * Tabla MySQL: anotacion_historia
 */

export interface AnotacionHistoria {

  // ==================================================
  // 1. IDENTIFICADOR DE LA ANOTACIÓN
  // ==================================================

  // Llave primaria generada automáticamente.
  id: number;

  // ==================================================
  // 2. IDENTIFICADOR DE LA HISTORIA MÉDICA
  // ==================================================

  // Relaciona la anotación con una historia médica.
  historiaId: number;

  // ==================================================
  // 3. IDENTIFICADOR DEL MÉDICO
  // ==================================================

  // Identifica al médico responsable.
  medicoId: number;

  // ==================================================
  // 4. FECHA DE LA ANOTACIÓN
  // ==================================================

  // Spring Boot devuelve la fecha en formato texto.
  // MySQL permite valores NULL en este campo.
  fecha: string | null;

  // ==================================================
  // 5. DESCRIPCIÓN DE LA ANOTACIÓN
  // ==================================================

  // Contiene las observaciones médicas registradas.
  descripcion: string;

}
