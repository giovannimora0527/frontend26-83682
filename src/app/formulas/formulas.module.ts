import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FormulasRoutingModule } from './formulas-routing.module';
import { FormulaListComponent } from './formula-list/formula-list.component';

/**
 * Modulo de gestion de Formulas Medicas. Solo incluye el listado, ya que
 * es lo unico que expone el backend para esta entidad (Requerimiento 1).
 */
@NgModule({
  declarations: [
    FormulaListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FormulasRoutingModule
  ]
})
export class FormulasModule { }
