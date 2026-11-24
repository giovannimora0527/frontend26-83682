export interface RangoFechas {
  desde: string;
  hasta: string;
}

/** Fecha local en formato yyyy-MM-dd. */
export function fechaIso(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** Fecha y hora local en formato yyyy-MM-ddTHH:mm:ss, sin zona. */
export function fechaHoraIso(fecha: Date): string {
  return `${fechaIso(fecha)}T${[fecha.getHours(), fecha.getMinutes(), fecha.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':')}`;
}

export type Atajo = 'hoy' | 'semana' | 'mes' | 'mesAnterior' | 'anio';

/** Rango del atajo; la semana va de lunes a domingo. */
export function rangoAtajo(atajo: Atajo, hoy = new Date()): RangoFechas {
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const dia = hoy.getDate();
  const rango = (desde: Date, hasta: Date): RangoFechas => ({ desde: fechaIso(desde), hasta: fechaIso(hasta) });
  switch (atajo) {
    case 'hoy':
      return rango(hoy, hoy);
    case 'semana': {
      const lunes = dia - ((hoy.getDay() + 6) % 7);
      return rango(new Date(anio, mes, lunes), new Date(anio, mes, lunes + 6));
    }
    case 'mes':
      return rango(new Date(anio, mes, 1), new Date(anio, mes + 1, 0));
    case 'mesAnterior':
      return rango(new Date(anio, mes - 1, 1), new Date(anio, mes, 0));
    case 'anio':
      return rango(new Date(anio, 0, 1), new Date(anio, 11, 31));
  }
}
