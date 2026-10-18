
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * CONFIGURACIÓN DE RUTAS DE ANGULAR
 * ==========================================================
 *
 * Cada módulo de gestión tiene una ruta independiente.
 * Todos los módulos se muestran dentro de AdminComponent.
 */

// ==========================================================
// 1. IMPORTACIONES DE ANGULAR
// ==========================================================

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// ==========================================================
// 2. COMPONENTE PRINCIPAL
// ==========================================================

import { AdminComponent } from './theme/layout/admin/admin.component';

// ==========================================================
// 3. COMPONENTES QUE YA EXISTÍAN
// ==========================================================

import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { CitaComponent } from './demo/pages/cita/cita.component';

// ==========================================================
// 4. NUEVOS COMPONENTES DE GESTIÓN
// ==========================================================

import { ClienteComponent } from './demo/pages/cliente/cliente.component';

import { RazaComponent } from './demo/pages/raza/raza.component';

import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';

import { MedicamentoComponent } from './demo/pages/medicamento/medicamento.component';

import { HistoriaMedicaComponent } from './demo/pages/historia-medica/historia-medica.component';

import { AnotacionHistoriaComponent } from './demo/pages/anotacion-historia/anotacion-historia.component';

import { SesionComponent } from './demo/pages/sesion/sesion.component';

import { FormulaComponent } from './demo/pages/formula/formula.component';

// ==========================================================
// 5. CONFIGURACIÓN DE RUTAS
// ==========================================================

export const routes: Routes = [

  // Redirigir desde la raíz de la aplicación.
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },

  // Todas las pantallas comparten el panel administrativo.
  {
    path: 'inicio',
    component: AdminComponent,
    data: { title: 'Inicio' },

    children: [

      // Tabla: usuario.
      {
        path: 'usuarios',
        component: UsuarioComponent,
        data: { title: 'Gestión de Usuarios' }
      },

      // Tabla: cliente.
      {
        path: 'clientes',
        component: ClienteComponent,
        data: { title: 'Gestión de Clientes' }
      },

      // Tabla: mascota.
      {
        path: 'mascotas',
        component: MascotaComponent,
        data: { title: 'Gestión de Mascotas' }
      },

      // Tabla: raza.
      {
        path: 'razas',
        component: RazaComponent,
        data: { title: 'Gestión de Razas' }
      },

      // Tabla: medico.
      {
        path: 'medicos',
        component: MedicoComponent,
        data: { title: 'Gestión de Médicos' }
      },

      // Tabla: especializacion.
      {
        path: 'especializaciones',
        component: EspecializacionComponent,
        data: { title: 'Gestión de Especializaciones' }
      },

      // Tabla: medicamento.
      {
        path: 'medicamentos',
        component: MedicamentoComponent,
        data: { title: 'Gestión de Medicamentos' }
      },

      // Tabla: formula_medica.
      // Ya no utiliza MedicoComponent.
      {
        path: 'formulas',
        component: FormulaComponent,
        data: { title: 'Gestión de Fórmulas' }
      },

      // Tabla: cita.
      // Se conserva el componente que ya funciona.
      {
        path: 'citas',
        component: CitaComponent,
        data: { title: 'Gestión de Citas' }
      },

      // Tabla: historia_medica.
      {
        path: 'historias-medicas',
        component: HistoriaMedicaComponent,
        data: { title: 'Gestión de Historias Médicas' }
      },

      // Tabla: anotacion_historia.
      {
        path: 'anotaciones',
        component: AnotacionHistoriaComponent,
        data: { title: 'Gestión de Anotaciones' }
      },

      // Tabla: sesion.
      {
        path: 'sesiones',
        component: SesionComponent,
        data: { title: 'Gestión de Sesiones' }
      }

    ]
  },

  // Manejar rutas inexistentes.
  {
    path: '**',
    redirectTo: 'inicio'
  }
];

// ==========================================================
// 6. REGISTRO DEL MÓDULO DE ENRUTAMIENTO
// ==========================================================

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
