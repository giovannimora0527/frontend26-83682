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

export type Columnas<T> = Record<string, (item: T) => ValorCelda>;

/** Estado de una tabla con búsqueda, orden por columna y paginación en el navegador. */
export class Tabla<T> {
  private datos: readonly T[] = [];
  private textoBusqueda = '';
  private paginaPedida = 1;
  private tamanoPagina: number;
  direccion: Direccion = 'asc';

  constructor(
    private readonly columnas: Columnas<T>,
    public columna: string,
    tamano = 10
  ) {
    this.tamanoPagina = tamano;
  }

  get items(): readonly T[] {
    return this.datos;
  }
  set items(valor: readonly T[]) {
    this.datos = valor;
  }

  get termino(): string {
    return this.textoBusqueda;
  }
  set termino(valor: string) {
    this.textoBusqueda = valor;
    this.paginaPedida = 1;
  }

  get tamano(): number {
    return this.tamanoPagina;
  }
  set tamano(valor: number) {
    this.tamanoPagina = valor;
    this.paginaPedida = 1;
  }

  get filtradas(): T[] {
    const valores = Object.values(this.columnas);
    return filtrar(this.datos, this.textoBusqueda, (item) => valores.map((valor) => valor(item)));
  }

  get visibles(): T[] {
    return paginar(ordenar(this.filtradas, this.columnas[this.columna], this.direccion), this.paginaPedida, this.tamanoPagina).items;
  }

  get pagina(): number {
    return paginar(this.filtradas, this.paginaPedida, this.tamanoPagina).pagina;
  }
  set pagina(valor: number) {
    this.paginaPedida = valor;
  }

  ordenarPor(columna: string): void {
    this.direccion = this.columna === columna && this.direccion === 'asc' ? 'desc' : 'asc';
    this.columna = columna;
    this.paginaPedida = 1;
  }

  ariaSort(columna: string): 'ascending' | 'descending' | 'none' {
    return this.columna !== columna ? 'none' : this.direccion === 'asc' ? 'ascending' : 'descending';
  }
}
