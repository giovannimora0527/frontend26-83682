
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * MODELO DE MEDICAMENTOS
 * ==========================================================
 *
 * Este archivo representa los medicamentos
 * recibidos desde el backend Spring Boot.
 *
 * Endpoint:
 * GET /clinica/v1/medicamento/listar
 *
 * Tabla de MySQL: medicamento
 */

export interface Medicamento {

  // Identificador único del medicamento.
  /** Identificador único del registro. */
  id: number;

  // Nombre registrado en MySQL.
  /** Nombre. */
  nombre: string;

  // Descripción del medicamento.
  // Puede ser nula en la base de datos.
  /** Descripción. */
  descripcion: string | null;

  // Presentación del medicamento.
  // Ejemplo: Tabletas 500mg.
  /** Presentación. */
  presentacion: string | null;

  // Fecha de compra.
  // Formato recibido: YYYY-MM-DD.
  /** Fecha compra. */
  fechaCompra: string;

  // Fecha de vencimiento.
  // Formato recibido: YYYY-MM-DD.
  /** Fecha vence. */
  fechaVence: string;

  // Fecha y hora de creación del registro.
  // Formato recibido: YYYY-MM-DDTHH:mm:ss.
  /** Fecha creación registro. */
  fechaCreacionRegistro: string;

  // Fecha y hora de última modificación.
  // Puede ser nula.
  /** Fecha modificación registro. */
  fechaModificacionRegistro: string | null;

}
