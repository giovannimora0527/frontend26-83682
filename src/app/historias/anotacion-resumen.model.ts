/**
 * Version resumida de una anotacion, tal como viene incluida dentro de
 * una HistoriaMedicaDTO (no se usa de forma independiente aqui; para el
 * CRUD completo de anotaciones ver el modulo "anotaciones").
 */
export interface AnotacionResumen {
  id: number;
  fecha: string;
  descripcion: string;
  historiaMedicaId: number;
}
