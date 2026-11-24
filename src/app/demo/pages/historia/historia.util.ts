import { AnotacionHistoria } from 'src/app/models/anotacion-historia';

export interface AtencionAnotada {
  motivo: string;
  sintomas: string;
  observaciones: string;
  recomendaciones: string;
}

/**
 * Al finalizar una atención, el backend la registra como anotación: "Motivo: …\nSíntomas: …" en la descripción y
 * "Recomendaciones: …" al final de las observaciones. Devuelve sus campos, o null si es una anotación manual.
 */
export function leerAtencion({ descripcion, observaciones }: Pick<AnotacionHistoria, 'descripcion' | 'observaciones'>): AtencionAnotada | null {
  const texto = /^Motivo: ([\s\S]*?)\nSíntomas: ([\s\S]*)$/.exec(descripcion ?? '');
  if (!texto) {
    return null;
  }
  const notas = observaciones ?? '';
  const recomendaciones = /(?:^|\n)Recomendaciones: ([\s\S]*)$/.exec(notas);
  return {
    motivo: texto[1].trim(),
    sintomas: texto[2].trim(),
    observaciones: notas.slice(0, recomendaciones ? recomendaciones.index : undefined).trim(),
    recomendaciones: recomendaciones?.[1].trim() ?? ''
  };
}
