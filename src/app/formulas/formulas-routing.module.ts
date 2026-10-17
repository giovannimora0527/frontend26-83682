import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormulaListComponent } from './formula-list/formula-list.component';

/**
 * Rutas internas del modulo de Formulas Medicas:
 *   /formulas -> FormulaListComponent
 *
 * Solo hay una ruta porque el backend, segun el Requerimiento 1, solo
 * expone el servicio de listado para esta entidad.
 */
const routes: Routes = [
  { path: '', component: FormulaListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FormulasRoutingModule { }
