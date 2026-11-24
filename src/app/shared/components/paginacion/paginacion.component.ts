import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Tabla } from '../../utils/tabla.util';

@Component({
  selector: 'app-paginacion',
  imports: [FormsModule, NgbPagination],
  template: `
    @if (tabla().filtradas.length > 0) {
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
        <label class="d-flex align-items-center gap-2 mb-0">
          Filas
          <select class="form-select form-select-sm w-auto" [ngModel]="tabla().tamano" (ngModelChange)="tabla().tamano = $event">
            @for (opcion of tamanos; track opcion) {
              <option [ngValue]="opcion">{{ opcion }}</option>
            }
          </select>
          <span class="text-muted">{{ tabla().filtradas.length }} registros</span>
        </label>
        <ngb-pagination
          class="mb-0"
          [collectionSize]="tabla().filtradas.length"
          [pageSize]="tabla().tamano"
          [page]="tabla().pagina"
          (pageChange)="tabla().pagina = $event"
          [maxSize]="5"
          [rotate]="true"
          size="sm"
        />
      </div>
    }
  `
})
export class PaginacionComponent {
  readonly tabla = input.required<Pick<Tabla<unknown>, 'filtradas' | 'tamano' | 'pagina'>>();
  readonly tamanos = [5, 10, 25, 50];
}
