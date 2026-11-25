import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Paginador común a todos los módulos: a la izquierda el total de registros (contenido proyectado) y a la
 * derecha un único contador «Página X de Y» entre los botones Anterior y Siguiente.
 *
 * Uso con paginación en el cliente (páginas desde 1):
 *   <app-paginador [pagina]="tabla.pagina" [totalPaginas]="tabla.totalPaginas" (cambiar)="tabla.irA($event)">
 *     {{ tabla.filtradas.length }} cliente(s)
 *   </app-paginador>
 *
 * Con paginación en el servidor sin total conocido, `abierto` oculta el «de Y».
 */
@Component({
  selector: 'app-paginador',
  template: `
    <div class="paginador">
      <small class="text-muted"><ng-content></ng-content></small>
      <nav class="paginador-controles" aria-label="Páginas">
        <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="deshabilitado || pagina <= 1"
          (click)="ir(pagina - 1)">‹ Anterior</button>
        <span class="paginador-contador" aria-live="polite">
          Página {{ pagina }}@if (!abierto) { de {{ totalPaginas }}}
        </span>
        <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="deshabilitado || pagina >= totalPaginas"
          (click)="ir(pagina + 1)">Siguiente ›</button>
      </nav>
    </div>
  `,
  styles: [`
    .paginador { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem; margin-top: .5rem; }
    .paginador-controles { display: flex; align-items: center; gap: .5rem; }
    .paginador-contador { min-width: 7.5rem; padding: .25rem .75rem; text-align: center; font-size: .875rem; color: #6c757d;
      border: 1px solid #dee2e6; border-radius: .375rem; background: #fff; }
  `]
})
export class PaginadorComponent {
  /** Página actual (desde 1). */
  @Input() pagina = 1;
  /** Total de páginas (o la última conocida cuando la lista es abierta). */
  @Input() totalPaginas = 1;
  /** Paginación en el servidor sin total: no se muestra «de Y». */
  @Input() abierto = false;
  /** Deshabilita los botones mientras se consulta. */
  @Input() deshabilitado = false;
  /** Página elegida (desde 1). */
  @Output() cambiar = new EventEmitter<number>();

  /** Emite la página elegida si es válida y distinta de la actual. */
  ir(numero: number): void {
    if (numero >= 1 && numero <= Math.max(1, this.totalPaginas) && numero !== this.pagina) {
      this.cambiar.emit(numero);
    }
  }
}
