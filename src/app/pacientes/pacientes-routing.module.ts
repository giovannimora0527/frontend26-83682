import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PacienteListComponent } from './paciente-list/paciente-list.component';
import { PacienteFormComponent } from './paciente-form/paciente-form.component';

/**
 * Rutas internas del modulo de Pacientes.
 * Estas rutas se combinan con el prefijo "/pacientes" definido en
 * app-routing.module.ts, entonces quedan como:
 *   /pacientes        -> PacienteListComponent
 *   /pacientes/nuevo   -> PacienteFormComponent
 */
const routes: Routes = [
  { path: '', component: PacienteListComponent },
  { path: 'nuevo', component: PacienteFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PacientesRoutingModule { }
