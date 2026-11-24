
/**
 * CLÍNICA VETERINARIA - UNIMINUTO
 * Modelo de los menús del sistema.
 */

export interface Menu {

  /** Identificador de menú. */
  menuId: number;

  /** Code. */
  code: string;

  /** Título visible. */
  title: string;

  /** Ruta de navegación. */
  url: string;

  /** Clase del ícono. */
  icon: string;

  /** Indica si el registro está activo. */
  activo: boolean;

  /** Fecha creación. */
  fechaCreacion: string;

  /** Fecha modificación. */
  fechaModificacion: string | null;

}
