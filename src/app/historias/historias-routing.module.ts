import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HistoriaListComponent } from './historia-list/historia-list.component';
import { HistoriaFormComponent } from './historia-form/historia-form.component';

/**
 * Rutas internas del modulo de Historias Medicas:
 *   /historias              -> HistoriaListComponent (con filtro por fecha)
 *   /historias/nueva        -> HistoriaFormComponent (modo creacion)
 *   /historias/editar/:id   -> HistoriaFormComponent (modo edicion)
 */
const routes: Routes = [
  { path: '', component: HistoriaListComponent },
  { path: 'nueva', component: HistoriaFormComponent },
  { path: 'editar/:id', component: HistoriaFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HistoriasRoutingModule { }
