
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
  id?: number;

  // Tipo de documento: CC, CE, etc.
  tipoDocumento?: string;

  // Número del documento de identidad.
  numeroDocumento?: string;

  // Nombres del médico veterinario.
  nombres?: string;

  // Apellidos del médico veterinario.
  apellidos?: string;

  // Teléfono del médico (puede ser nulo).
  telefono?: string | null;

  // Número de registro profesional.
  registroProfesional?: string;

  // Identificador de su especialización.
  especializacionId?: number;

}
