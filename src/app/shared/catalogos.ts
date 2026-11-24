import { TipoServicio, ViaAdministracion } from '../models/estados';

export const TIPOS_SERVICIO: { valor: TipoServicio; etiqueta: string }[] = [
  { valor: 'CONSULTA', etiqueta: 'Consulta' },
  { valor: 'PROCEDIMIENTO', etiqueta: 'Procedimiento' },
  { valor: 'VACUNACION', etiqueta: 'Vacunación' },
  { valor: 'CIRUGIA', etiqueta: 'Cirugía' },
  { valor: 'LABORATORIO', etiqueta: 'Laboratorio' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

export const VIAS_ADMINISTRACION: { valor: ViaAdministracion; etiqueta: string }[] = [
  { valor: 'ORAL', etiqueta: 'Oral' },
  { valor: 'TOPICA', etiqueta: 'Tópica' },
  { valor: 'OFTALMICA', etiqueta: 'Oftálmica' },
  { valor: 'OTICA', etiqueta: 'Ótica' },
  { valor: 'SUBCUTANEA', etiqueta: 'Subcutánea' },
  { valor: 'INTRAMUSCULAR', etiqueta: 'Intramuscular' },
  { valor: 'INTRAVENOSA', etiqueta: 'Intravenosa' },
  { valor: 'OTRA', etiqueta: 'Otra' }
];

export function etiquetaDe<T extends string>(catalogo: { valor: T; etiqueta: string }[], valor: T | null | undefined): string {
  return catalogo.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor ?? '';
}
