import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { RazaComponent } from './demo/pages/raza/raza.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { HistoriaMedicaComponent } from './demo/pages/historia-medica/historia-medica.component';
import { AnotacionHistoriaComponent } from './demo/pages/anotacion-historia/anotacion-historia.component';
import { MedicamentoComponent } from './demo/pages/medicamento/medicamento.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';

/**
 * Rutas principales de la aplicación.
 * La ruta base redirige al módulo principal de inicio y cada subruta representa
 * una vista del sistema de gestión veterinaria.
 */
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
      { path: 'medicos', component: MedicoComponent, data: { title: 'Médicos' } },
      { path: 'especializaciones', component: EspecializacionComponent, data: { title: 'Especializaciones' } },
      { path: 'citas', component: CitaComponent, data: { title: 'Citas' } },
      { path: 'historias-medicas', component: HistoriaMedicaComponent, data: { title: 'Historias Médicas' } },
      { path: 'anotaciones', component: AnotacionHistoriaComponent, data: { title: 'Anotaciones' } },
      { path: 'medicamentos', component: MedicamentoComponent, data: { title: 'Medicamentos' } },
      { path: 'formulas-medicas', component: FormulaMedicaComponent, data: { title: 'Fórmulas Médicas' } }
      /* Inserte nuevos menus aquí */
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
