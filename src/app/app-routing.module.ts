import { Type } from '@angular/core';
import { Route, Routes } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { EnConstruccionComponent } from './demo/pages/en-construccion/en-construccion.component';
import { LoginComponent } from './demo/pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { menuGuard } from './guards/menu.guard';

/** Ruta hija de /inicio autorizada por el menú indicado; su path coincide con el código salvo en citas. */
const ruta = (menu: string, title: string, component: Type<unknown>, path = menu): Route => ({
  path,
  component,
  canActivate: [menuGuard],
  data: { title, menu }
});

/** Igual que ruta, pero la pantalla se descarga solo cuando se visita. */
const diferida = (menu: string, title: string, loadComponent: Route['loadComponent'], path = menu): Route => ({
  path,
  loadComponent,
  canActivate: [menuGuard],
  data: { title, menu }
});

const modulos: Routes = [
  ruta('usuarios', 'Usuarios', UsuarioComponent),
  ruta('clientes', 'Clientes', ClienteComponent),
  ruta('medicos', 'Médicos', MedicoComponent),
  ruta('especializaciones', 'Especializaciones', EspecializacionComponent),
  ruta('tarifas', 'Tarifas', EnConstruccionComponent),
  ruta('cita', 'Citas', CitaComponent, 'citas'),
  diferida('calendario', 'Mi calendario', () => import('./demo/pages/calendario/calendario.component').then((m) => m.CalendarioComponent)),
  ruta('atencion', 'Atención médica', EnConstruccionComponent),
  ruta('atencion', 'Atención médica', EnConstruccionComponent, 'atencion/:citaId'),
  ruta('historias', 'Historias clínicas', HistoriaComponent),
  ruta('formulas', 'Fórmulas médicas', FormulaMedicaComponent),
  ruta('mascotas', 'Mascotas', MascotaComponent),
  diferida('inventario', 'Inventario', () => import('./demo/pages/inventario/inventario.component').then((m) => m.InventarioComponent)),
  diferida('inventario', 'Detalle del producto', () =>
    import('./demo/pages/inventario/producto-detalle/producto-detalle.component').then((m) => m.ProductoDetalleComponent), 'inventario/:id'),
  diferida('carga-inventario', 'Carga masiva', () =>
    import('./demo/pages/carga-inventario/carga-inventario.component').then((m) => m.CargaInventarioComponent)),
  ruta('despacho', 'Despacho', EnConstruccionComponent),
  ruta('facturacion', 'Facturación', EnConstruccionComponent),
  ruta('reportes', 'Reportes', EnConstruccionComponent)
];

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { path: 'login', component: LoginComponent, data: { title: 'Login' } },
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    data: { title: 'Inicio' },
    // La ruta vacía evita que el comodín capture /inicio y se redirija a sí mismo.
    children: [{ path: '', pathMatch: 'full', children: [] }, ...modulos, { path: '**', redirectTo: '/inicio' }]
  },
  { path: '**', redirectTo: 'login' }
];
