import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CitasRoutingModule } from './citas-routing.module';
import { CitaListComponent } from './cita-list/cita-list.component';
import { CitaFormComponent } from './cita-form/cita-form.component';

/**
 * Modulo de gestion de Citas: agrupa la lista (con filtro por rango de
 * fechas), el formulario de creacion/edicion y el enrutamiento interno
 * de esta seccion. Se carga de forma perezosa desde app-routing.module.ts.
 */
@NgModule({
  declarations: [
    CitaListComponent,
    CitaFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CitasRoutingModule
  ]
})
export class CitasModule { }
