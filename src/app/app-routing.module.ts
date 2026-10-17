import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/**
 * Rutas principales de la aplicacion.
 *
 * Cada tabla de la base de datos (Paciente, Cita, FormulaMedica,
 * HistoriaMedica, AnotacionHistoria) es un "modulo de gestion" distinto,
 * con su propio modulo de Angular y su propio archivo de rutas internas
 * (ver <modulo>-routing.module.ts dentro de cada carpeta).
 *
 * Se usa "loadChildren" (carga perezosa / lazy loading): el codigo de cada
 * modulo solo se descarga en el navegador cuando el usuario realmente entra
 * a esa seccion del menu, lo que hace la aplicacion mas rapida de cargar.
 */
const routes: Routes = [
  {
    // Ruta vacia ("/"): redirige automaticamente al modulo de pacientes.
    path: '',
    redirectTo: 'pacientes',
    pathMatch: 'full'
  },
  {
    path: 'pacientes',
    loadChildren: () => import('./pacientes/pacientes.module').then(m => m.PacientesModule)
  },
  {
    path: 'citas',
    loadChildren: () => import('./citas/citas.module').then(m => m.CitasModule)
  },
  {
    path: 'formulas',
    loadChildren: () => import('./formulas/formulas.module').then(m => m.FormulasModule)
  },
  {
    path: 'historias',
    loadChildren: () => import('./historias/historias.module').then(m => m.HistoriasModule)
  },
  {
    path: 'anotaciones',
    loadChildren: () => import('./anotaciones/anotaciones.module').then(m => m.AnotacionesModule)
  },
  {
    // Cualquier ruta que no coincida con las anteriores, vuelve al inicio.
    path: '**',
    redirectTo: 'pacientes'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
