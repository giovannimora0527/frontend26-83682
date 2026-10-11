import { Component, Input } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';

// Definicion de una columna de la tabla: titulo y funcion que extrae el valor a mostrar.
export interface Columna {
  titulo: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valor: (item: any) => unknown;
}

// Formatea fechas que llegan del backend (ISO) para mostrarlas en las tablas.
export function fechaHora(valor?: Date | string | null): string {
  return valor ? formatDate(valor, 'yyyy-MM-dd HH:mm', 'en-US') : '';
}

export function soloFecha(valor?: Date | string | null): string {
  return valor ? formatDate(valor, 'yyyy-MM-dd', 'en-US') : '';
}

/**
 * Tabla reutilizable con buscador y paginacion. Los filtros propios de cada modulo
 * se proyectan dentro del encabezado con el selector [filtros].
 */
@Component({
  selector: 'app-tabla-listado',
  imports: [CommonModule],
  templateUrl: './tabla-listado.component.html'
})
export class TablaListadoComponent {
  @Input() titulo = '';
  @Input() columnas: Columna[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() items: any[] = [];

  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 10;

  // Items que cumplen con el termino de busqueda (sin acentos y sin distinguir mayusculas).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get filtrados(): any[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.items;
    }
    return this.items.filter((item) =>
      this.columnas.some((col) =>
        this.normalizarTexto(String(col.valor(item) ?? '')).includes(termino)
      )
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get paginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.filtrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.filtrados.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }
}
