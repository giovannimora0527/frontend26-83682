import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CitaListComponent } from './cita-list/cita-list.component';
import { CitaFormComponent } from './cita-form/cita-form.component';

/**
 * Rutas internas del modulo de Citas:
 *   /citas              -> CitaListComponent (con filtro por fecha)
 *   /citas/nueva         -> CitaFormComponent (modo creacion)
 *   /citas/editar/:id    -> CitaFormComponent (modo edicion)
 */
const routes: Routes = [
  { path: '', component: CitaListComponent },
  { path: 'nueva', component: CitaFormComponent },
  { path: 'editar/:id', component: CitaFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CitasRoutingModule { }
