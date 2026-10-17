import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AnotacionesRoutingModule } from './anotaciones-routing.module';
import { AnotacionListComponent } from './anotacion-list/anotacion-list.component';
import { AnotacionFormComponent } from './anotacion-form/anotacion-form.component';

/**
 * Modulo de gestion de Anotaciones de Historia Medica: crear, listar por
 * historia medica y actualizar (Requerimiento 5 del backend; no se pide
 * eliminar para esta entidad). Se carga de forma perezosa desde
 * app-routing.module.ts.
 */
@NgModule({
  declarations: [
    AnotacionListComponent,
    AnotacionFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AnotacionesRoutingModule
  ]
})
export class AnotacionesModule { }
