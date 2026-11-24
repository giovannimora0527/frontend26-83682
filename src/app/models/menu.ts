
/**
 * CLÍNICA VETERINARIA - UNIMINUTO
 * Modelo de los menús del sistema.
 */

export interface Menu {

  menuId: number;

  code: string;

  title: string;

  url: string;

  icon: string;

  activo: boolean;

  fechaCreacion: string;

  fechaModificacion: string | null;

}
