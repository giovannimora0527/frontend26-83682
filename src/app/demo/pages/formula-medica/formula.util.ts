/** ceil(dosis × (24 / frecuencia) × días), como mínimo 1. En centésimas para no arrastrar errores decimales. */
export function cantidadSugerida(dosis: number | null, frecuenciaHoras: number | null, duracionDias: number | null): number | null {
  const [d, f, n] = [Number(dosis), Number(frecuenciaHoras), Number(duracionDias)];
  if (!(d > 0) || !(f > 0) || !(n > 0)) {
    return null;
  }
  return Math.max(1, Math.ceil((Math.round(d * 100) * 24 * n) / (100 * f)));
}
