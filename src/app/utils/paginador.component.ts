import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Paginador común a todos los módulos: muestra el resumen («N registro(s) · página X de Y») y los botones
 * Anterior, números de página (la actual resaltada) y Siguiente. El resumen se proyecta como contenido.
 *
 * Uso con paginación en el cliente (páginas desde 1):
 *   <app-paginador [pagina]="tabla.pagina" [totalPaginas]="tabla.totalPaginas" (cambiar)="tabla.irA($event)">
 *     {{ tabla.filtradas.length }} cliente(s)
 *   </app-paginador>
 *
 * Con paginación en el servidor sin total conocido, `abierto` indica que puede haber más páginas.
 */
@Component({
  selector: 'app-paginador',
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
      <small class="text-muted">
        <ng-content></ng-content> · Página <strong>{{ pagina }}</strong>
        @if (!abierto) { de <strong>{{ totalPaginas }}</strong> }
      </small>
      <nav aria-label="Páginas">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="deshabilitado || pagina <= 1">
            <button type="button" class="page-link" [disabled]="deshabilitado || pagina <= 1" (click)="ir(pagina - 1)">Anterior</button>
          </li>
          @for (numero of numeros; track $index) {
            @if (numero === 0) {
              <li class="page-item disabled"><span class="page-link">…</span></li>
            } @else {
              <li class="page-item" [class.active]="numero === pagina">
                <button type="button" class="page-link" [disabled]="deshabilitado"
                  [attr.aria-current]="numero === pagina ? 'page' : null" (click)="ir(numero)">{{ numero }}</button>
              </li>
            }
          }
          <li class="page-item" [class.disabled]="deshabilitado || pagina >= totalPaginas">
            <button type="button" class="page-link" [disabled]="deshabilitado || pagina >= totalPaginas" (click)="ir(pagina + 1)">Siguiente</button>
          </li>
        </ul>
      </nav>
    </div>
  `
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

  /** Números a mostrar: primera, última y dos alrededor de la actual; 0 representa «…». */
  get numeros(): number[] {
    const total = Math.max(1, this.totalPaginas);
    const visibles = [...new Set([1, total, ...[-2, -1, 0, 1, 2].map(d => this.pagina + d)])]
      .filter(n => n >= 1 && n <= total)
      .sort((a, b) => a - b);
    const resultado: number[] = [];
    visibles.forEach((n, i) => {
      if (i > 0 && n - visibles[i - 1] > 1) resultado.push(0);
      resultado.push(n);
    });
    return resultado;
  }

  /** Emite la página elegida si es válida y distinta de la actual. */
  ir(numero: number): void {
    if (numero >= 1 && numero <= Math.max(1, this.totalPaginas) && numero !== this.pagina) {
      this.cambiar.emit(numero);
    }
  }
}
