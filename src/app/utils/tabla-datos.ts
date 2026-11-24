/**
 * Utilidad reutilizable para los DataTables de la aplicación: búsqueda de texto, filtros adicionales,
 * ordenamiento por columna (ascendente/descendente) y paginación en el cliente.
 *
 * Uso:
 *   tabla = new TablaDatos<Fila>(['nombre', 'fecha'], 'fecha', 'desc');
 *   tabla.datos = filasDelBackend;
 *   tabla.visibles  -> filas de la página actual
 */
export class TablaDatos<T extends object> {
  /** Filas completas recibidas del backend. */
  private filas: T[] = [];
  /** Texto de búsqueda libre. */
  busqueda = '';
  /** Columna por la que se ordena. */
  columna: keyof T;
  /** Dirección del orden. */
  direccion: 'asc' | 'desc';
  /** Página actual (desde 1). */
  pagina = 1;
  /** Filtro adicional opcional (por ejemplo, estado o rango de fechas). */
  filtroExtra: (fila: T) => boolean = () => true;

  /**
   * @param camposBusqueda campos en los que se busca el texto libre.
   * @param columnaInicial columna de orden inicial.
   * @param direccionInicial dirección inicial (por defecto descendente: lo más reciente primero).
   * @param porPagina filas por página.
   */
  constructor(
    /** Lista de campos búsqueda. */
    private readonly camposBusqueda: (keyof T)[],
    /** Columna inicial. */
    columnaInicial: keyof T,
    /** Dirección inicial. */
    direccionInicial: 'asc' | 'desc' = 'desc',
    /** Por página. */
    readonly porPagina = 10
  ) {
    this.columna = columnaInicial;
    this.direccion = direccionInicial;
  }

  /** Reemplaza los datos y ajusta la página si quedó fuera de rango. */
  set datos(filas: T[]) {
    this.filas = filas ?? [];
    this.pagina = Math.min(this.pagina, this.totalPaginas);
  }

  /**
   * Datos.
   *
   * @returns resultado de datos.
   */
  get datos(): T[] {
    return this.filas;
  }

  /** Filas que cumplen la búsqueda y el filtro adicional, ya ordenadas. */
  get filtradas(): T[] {
    const texto = this.busqueda.trim().toLowerCase();
    const resultado = this.filas.filter(fila =>
      this.filtroExtra(fila) &&
      (!texto || this.camposBusqueda.some(c => String(fila[c] ?? '').toLowerCase().includes(texto))));
    const factor = this.direccion === 'asc' ? 1 : -1;
    return resultado.sort((a, b) => factor * TablaDatos.comparar(a[this.columna], b[this.columna]));
  }

  /** Filas de la página actual. */
  get visibles(): T[] {
    const inicio = (this.pagina - 1) * this.porPagina;
    return this.filtradas.slice(inicio, inicio + this.porPagina);
  }

  /**
   * Total páginas.
   *
   * @returns valor numérico calculado.
   */
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filtradas.length / this.porPagina));
  }

  /** Ordena por una columna; si ya estaba ordenada por ella, invierte la dirección. */
  ordenarPor(columna: keyof T): void {
    if (this.columna === columna) {
      this.direccion = this.direccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.columna = columna;
      this.direccion = 'asc';
    }
    this.pagina = 1;
  }

  /** Ícono del encabezado según el orden actual. */
  icono(columna: keyof T): string {
    if (this.columna !== columna) return '↕';
    return this.direccion === 'asc' ? '▲' : '▼';
  }

  /** Vuelve a la primera página (usar al cambiar filtros). */
  reiniciar(): void {
    this.pagina = 1;
  }

  /**
   * Navega a a.
   *
   * @param pagina número de página.
   */
  irA(pagina: number): void {
    this.pagina = Math.min(Math.max(1, pagina), this.totalPaginas);
  }

  /** Compara números, fechas ISO y textos (sin distinguir mayúsculas ni tildes). */
  static comparar(a: unknown, b: unknown): number {
    if (a === b) return 0;
    if (a === null || a === undefined || a === '') return 1;
    if (b === null || b === undefined || b === '') return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true });
  }
}

/** Formatea una fecha ISO del backend ("2026-11-24T10:30:00") como "2026-11-24". */
export function soloFecha(valor: string | null | undefined): string {
  return valor ? valor.slice(0, 10) : '—';
}

/** Formatea una fecha ISO del backend como hora "10:30". */
export function soloHora(valor: string | null | undefined): string {
  return valor && valor.length >= 16 ? valor.slice(11, 16) : '—';
}

/** Extrae el mensaje de error del backend ({mensaje}) o un mensaje genérico comprensible. */
export function mensajeError(error: { status?: number; error?: { mensaje?: string } }, porDefecto: string): string {
  if (error?.status === 0) return 'No hay conexión con el servidor. Verifica que el backend esté en ejecución.';
  return error?.error?.mensaje ?? porDefecto;
}
