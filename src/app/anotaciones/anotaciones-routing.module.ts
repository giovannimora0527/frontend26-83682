import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnotacionListComponent } from './anotacion-list/anotacion-list.component';
import { AnotacionFormComponent } from './anotacion-form/anotacion-form.component';

/**
 * Rutas internas del modulo de Anotaciones de Historia Medica:
 *   /anotaciones                -> AnotacionListComponent (usa ?historiaId=)
 *   /anotaciones/nueva          -> AnotacionFormComponent (modo creacion)
 *   /anotaciones/editar/:id     -> AnotacionFormComponent (modo edicion)
 */
const routes: Routes = [
  { path: '', component: AnotacionListComponent },
  { path: 'nueva', component: AnotacionFormComponent },
  { path: 'editar/:id', component: AnotacionFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnotacionesRoutingModule { }
