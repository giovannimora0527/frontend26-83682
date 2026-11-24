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

const modulos: Routes = [
  ruta('usuarios', 'Usuarios', UsuarioComponent),
  ruta('clientes', 'Clientes', ClienteComponent),
  ruta('medicos', 'Médicos', MedicoComponent),
  ruta('especializaciones', 'Especializaciones', EspecializacionComponent),
  ruta('tarifas', 'Tarifas', EnConstruccionComponent),
  ruta('cita', 'Citas', CitaComponent, 'citas'),
  ruta('calendario', 'Mi calendario', EnConstruccionComponent),
  ruta('atencion', 'Atención médica', EnConstruccionComponent),
  ruta('historias', 'Historias clínicas', HistoriaComponent),
  ruta('formulas', 'Fórmulas médicas', FormulaMedicaComponent),
  ruta('mascotas', 'Mascotas', MascotaComponent),
  ruta('inventario', 'Inventario', EnConstruccionComponent),
  ruta('carga-inventario', 'Carga masiva', EnConstruccionComponent),
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
    children: [...modulos, { path: '**', redirectTo: '/inicio' }]
  },
  { path: '**', redirectTo: 'login' }
];
