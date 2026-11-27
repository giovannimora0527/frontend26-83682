/**
 * Cantidad a dispensar según la formulación: dosis × tomas por día × días de tratamiento.
 * Es la misma regla del backend (FormulaIntegracionService.calcularCantidad), que es quien la aplica al guardar;
 * aquí solo se muestra en vivo mientras el veterinario escribe.
 * Ejemplos: «1», «cada 12 horas», «7 días» → 14 · «1/2», «cada 8 horas», «3 días» → 5 · «2», «3 veces al día», «1 semana» → 42.
 *
 * @param dosis dosis por toma (debe contener un número).
 * @param frecuencia «cada N horas», «N veces al día»…; si no se reconoce, una toma diaria.
 * @param duracion «N días», «N semanas» o «N meses».
 * @returns unidades a dispensar (mínimo 1).
 */
export function calcularCantidad(dosis: string | null | undefined, frecuencia: string | null | undefined,
                                 duracion: string | null | undefined): number {
  const porToma = numero(dosis, 1);
  const f = (frecuencia ?? '').toLowerCase();
  let tomasDia = 1;
  if (f.includes('hora')) {
    tomasDia = 24 / Math.max(1, numero(f, 24));
  } else if (f.includes('vez') || f.includes('veces')) {
    tomasDia = numero(f, 1);
  }
  const d = (duracion ?? '').toLowerCase();
  const dias = numero(d, 1) * (d.includes('semana') ? 7 : d.includes('mes') ? 30 : 1);
  return Math.max(1, Math.ceil(porToma * tomasDia * dias - 1e-9));
}

/** Primer número del texto (entero, decimal con punto o coma, o fracción «1/2»). */
function numero(texto: string | null | undefined, porDefecto: number): number {
  const m = /(\d+)\s*\/\s*(\d+)|(\d+(?:[.,]\d+)?)/.exec(texto ?? '');
  if (!m) return porDefecto;
  if (m[1] !== undefined) {
    const den = Number(m[2]);
    return den === 0 ? porDefecto : Number(m[1]) / den;
  }
  return Number(m[3].replace(',', '.'));
}
