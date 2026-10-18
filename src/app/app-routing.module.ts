import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';
import { CitasComponent } from './demo/pages/cita/citas.component';
import { HistoriaClinicaComponent } from './demo/pages/historia-clinica/historia-clinica.component';
import { AnotacionesComponent } from './demo/pages/anotacion/anotaciones.component';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },  
  {
    path: 'inicio',
    component: AdminComponent,
    data: { title: 'Inicio' },
    children: [      
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' }},
      { path: 'medicos', component: MedicoComponent, data: { title: 'Medicos' }},
      { path: 'formulas-medicas', component: FormulaMedicaComponent, data: { title: 'Fórmulas médicas' }},
      { path: 'citas', component: CitasComponent, data: { title: 'Citas médicas' }},
      { path: 'historias-clinicas', component: HistoriaClinicaComponent, data: { title: 'Historias clínicas' }},
      { path: 'anotaciones', component: AnotacionesComponent, data: { title: 'Anotaciones clínicas' }}
      /* Inserte nuevos menus aqui */
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
