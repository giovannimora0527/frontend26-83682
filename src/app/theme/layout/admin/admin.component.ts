// angular import
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// project import
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { ConfigurationComponent } from 'src/app/theme/layout/admin/configuration/configuration.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';


import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { MenuService } from 'src/app/services/menu.service';
import { AuthService } from 'src/app/services/auth.service';



@Component({
  selector: 'app-admin',
  imports: [NavBarComponent, NavigationComponent, RouterModule, CommonModule, ConfigurationComponent, BreadcrumbsComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {

  // Servicio que consulta los permisos desde Spring Boot.
  private readonly menuService = inject(MenuService);

  readonly auth = inject(AuthService);
  /** Accesos rápidos de la página de inicio, según los menús permitidos al perfil. */
  private static readonly ACCESOS: { code: string; texto: string; icono: string }[] = [
    { code: 'mascotas', texto: 'Gestionar mascotas', icono: 'feather icon-heart' },
    { code: 'historias', texto: 'Gestionar historias médicas', icono: 'feather icon-file-text' },
    { code: 'usuarios', texto: 'Gestionar usuarios', icono: 'feather icon-users' },
    { code: 'cita', texto: 'Gestionar citas', icono: 'feather icon-calendar' },
    { code: 'clientes', texto: 'Gestionar clientes', icono: 'feather icon-user-check' },
    { code: 'medicamentos', texto: 'Gestionar medicamentos', icono: 'feather icon-package' },
    { code: 'formulas', texto: 'Gestionar fórmulas', icono: 'feather icon-clipboard' },
    { code: 'despacho', texto: 'Despachar fórmulas', icono: 'feather icon-truck' },
    { code: 'facturacion', texto: 'Facturación', icono: 'feather icon-dollar-sign' },
    { code: 'reportes', texto: 'Reportes', icono: 'feather icon-bar-chart-2' }
  ];

  readonly accesos = toSignal(
    this.menuService.obtenerMenusPropios().pipe(
      map(menus => AdminComponent.ACCESOS
        .map(a => ({ ...a, url: menus.find(m => m.code === a.code)?.url }))
        .filter((a): a is { code: string; texto: string; icono: string; url: string } => !!a.url)
        .slice(0, 6)),
      catchError(() => of([]))
    ),
    { initialValue: [] as { code: string; texto: string; icono: string; url: string }[] }
  );

  private readonly router = inject(Router);

  // public props
  navCollapsed: any;
  navCollapsedMob: boolean;
  windowWidth: number;

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  get isHome(): boolean {
    return this.router.url === '/inicio';
  }

  // public method
  navMobClick() {
    if (this.navCollapsedMob && !document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob = !this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }
  }

  // this is for eslint rule
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    const navigation = document.querySelector('app-navigation.pcoded-navbar');
    if (navigation?.classList.contains('mob-open')) {
      navigation.classList.remove('mob-open');
    }
  }
}
