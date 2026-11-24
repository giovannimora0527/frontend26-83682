
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
  id: number;

  // Nombre registrado en MySQL.
  nombre: string;

  // Descripción del medicamento.
  // Puede ser nula en la base de datos.
  descripcion: string | null;

  // Presentación del medicamento.
  // Ejemplo: Tabletas 500mg.
  presentacion: string | null;

  // Fecha de compra.
  // Formato recibido: YYYY-MM-DD.
  fechaCompra: string;

  // Fecha de vencimiento.
  // Formato recibido: YYYY-MM-DD.
  fechaVence: string;

  // Fecha y hora de creación del registro.
  // Formato recibido: YYYY-MM-DDTHH:mm:ss.
  fechaCreacionRegistro: string;

  // Fecha y hora de última modificación.
  // Puede ser nula.
  fechaModificacionRegistro: string | null;

}
