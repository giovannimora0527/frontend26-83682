export type Direccion = 'asc' | 'desc';
export type ValorCelda = string | number | boolean | null | undefined;

/** Minúsculas y sin tildes, para comparar textos. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Conserva los elementos en los que algún valor contiene el término. */
export function filtrar<T>(lista: readonly T[], termino: string, valores: (item: T) => ValorCelda[]): T[] {
  const buscado = normalizarTexto(termino.trim());
  return buscado
    ? lista.filter((item) => valores(item).some((valor) => normalizarTexto(String(valor ?? '')).includes(buscado)))
    : [...lista];
}

/** Devuelve una copia ordenada; no modifica la lista original. */
export function ordenar<T>(lista: readonly T[], valor: (item: T) => ValorCelda, direccion: Direccion): T[] {
  const signo = direccion === 'asc' ? 1 : -1;
  return [...lista].sort((itemA, itemB) => {
    const a = valor(itemA);
    const b = valor(itemB);
    return typeof a === 'number' && typeof b === 'number'
      ? signo * (a - b)
      : signo * String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' });
  });
}

export interface Pagina<T> {
  items: T[];
  pagina: number;
  totalPaginas: number;
}

/** Recorta la página pedida; si se sale de rango usa la más cercana. */
export function paginar<T>(lista: readonly T[], pagina: number, tamano: number): Pagina<T> {
  const totalPaginas = Math.ceil(lista.length / tamano);
  const actual = Math.max(1, Math.min(pagina, totalPaginas || 1));
  return { items: lista.slice((actual - 1) * tamano, actual * tamano), pagina: actual, totalPaginas };
}
