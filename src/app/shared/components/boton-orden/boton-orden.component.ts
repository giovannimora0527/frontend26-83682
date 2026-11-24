import { Component, input } from '@angular/core';
import { Tabla } from '../../utils/tabla.util';

/** Encabezado que ordena una tabla por columna. El th lleva [attr.aria-sort]="tabla.ariaSort('columna')". */
@Component({
  selector: 'app-boton-orden',
  template: `
    <button type="button" class="btn btn-link p-0 text-dark text-decoration-none fw-bold mb-0" (click)="tabla().ordenarPor(columna())">
      <ng-content />
      <i class="fa" [class]="icono" aria-hidden="true"></i>
    </button>
  `
})
export class BotonOrdenComponent {
  readonly tabla = input.required<Pick<Tabla<unknown>, 'ordenarPor' | 'ariaSort'>>();
  readonly columna = input.required<string>();

  get icono(): string {
    return { ascending: 'fa-sort-up', descending: 'fa-sort-down', none: 'fa-sort' }[this.tabla().ariaSort(this.columna())];
  }
}
