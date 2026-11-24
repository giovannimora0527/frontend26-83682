
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * MODELO DE MÉDICOS VETERINARIOS
 * ==========================================================
 *
 * Representa los médicos registrados en MySQL.
 *
 * Los nombres de las propiedades coinciden
 * con los datos JSON que devuelve Spring Boot.
 *
 * Endpoint:
 * GET /clinica/v1/medico/listar
 */

export class Medico {

  // Identificador único del médico.
  /** Identificador único del registro. */
  id?: number;
  /** Indica si el registro está activo. */
  activo?: boolean;

  // Tipo de documento: CC, CE, etc.
  /** Tipo documento. */
  tipoDocumento?: string;

  // Número del documento de identidad.
  /** Número documento. */
  numeroDocumento?: string;

  // Nombres del médico veterinario.
  /** Nombres de la persona. */
  nombres?: string;

  // Apellidos del médico veterinario.
  /** Apellidos de la persona. */
  apellidos?: string;

  // Teléfono del médico (puede ser nulo).
  /** Número de teléfono. */
  telefono?: string | null;

  // Número de registro profesional.
  /** Registro profesional. */
  registroProfesional?: string;

  // Identificador de su especialización.
  /** Identificador de especialización. */
  especializacionId?: number;

}
