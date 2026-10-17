import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HistoriasRoutingModule } from './historias-routing.module';
import { HistoriaListComponent } from './historia-list/historia-list.component';
import { HistoriaFormComponent } from './historia-form/historia-form.component';

/**
 * Modulo de gestion de Historias Medicas: CRUD completo (crear, listar
 * con filtro de fechas, editar y eliminar), segun el Requerimiento 5 del
 * backend. Se carga de forma perezosa desde app-routing.module.ts.
 */
@NgModule({
  declarations: [
    HistoriaListComponent,
    HistoriaFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HistoriasRoutingModule
  ]
})
export class HistoriasModule { }
