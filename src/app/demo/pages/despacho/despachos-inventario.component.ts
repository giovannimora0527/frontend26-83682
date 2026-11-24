import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogDespachosComponent } from './log-despachos/log-despachos.component';

/** Log de despachos dentro del inventario: es el acceso del ADMINISTRADOR, que no tiene el menú de despacho. */
@Component({
  selector: 'app-despachos-inventario',
  imports: [RouterLink, LogDespachosComponent],
  template: `
    <a class="btn btn-sm btn-outline-secondary" routerLink="/inicio/inventario"><i class="fa fa-arrow-left" aria-hidden="true"></i> Volver al inventario</a>
    <div class="card"><div class="card-header"><h2 class="h5 mb-0">Log de despachos</h2></div><div class="card-body"><app-log-despachos /></div></div>
  `
})
export class DespachosInventarioComponent {}
