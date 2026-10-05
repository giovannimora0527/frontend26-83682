import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { RazaComponent } from './demo/pages/raza/raza.component';

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
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' } },
      { path: 'clientes', component: ClienteComponent, data: { title: 'Clientes' } },
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' } },
      { path: 'razas', component: RazaComponent, data: { title: 'Razas' } },
      { path: 'medicos', component: MedicoComponent, data: { title: 'Médicos' } }
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
