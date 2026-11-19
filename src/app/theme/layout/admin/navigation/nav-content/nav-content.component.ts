
/**
 * ====================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * MENÚ DINÁMICO CON SPRING BOOT Y MYSQL
 * ====================================================
 *
 * Consulta los menús autorizados desde el backend.
 * Conserva las rutas, los iconos y el diseño
 * definidos en navigation.ts.
 */

// ================================================
// 1. IMPORTACIONES
// ================================================

import {
  Component,
  OnInit,
  inject,
  output
} from '@angular/core';

import { Location } from '@angular/common';

import { environment } from 'src/environments/environment';

import {
  NavigationItem,
  NavigationItems
} from '../navigation';

import { SharedModule } from
  'src/app/theme/shared/shared.module';

import { NavGroupComponent } from
  './nav-group/nav-group.component';

import { MenuService } from
  'src/app/services/menu.service';

import { Menu } from
  'src/app/models/menu';

// ================================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// ================================================

@Component({
  selector: 'app-nav-content',

  imports: [
    SharedModule,
    NavGroupComponent
  ],

  templateUrl: './nav-content.component.html',

  styleUrls: ['./nav-content.component.scss']
})

// ================================================
// 3. COMPONENTE PRINCIPAL
// ================================================

export class NavContentComponent implements OnInit {

  private location = inject(Location);

  private menuService = inject(MenuService);

  // Información de la aplicación.
  title = 'Clínica Veterinaria - Uniminuto';

  currentApplicationVersion = environment.appVersion;

  // Menús que aparecerán en pantalla.
  navigations: NavigationItem[] = [];

  // Propiedades existentes del diseño.
  wrapperWidth: number;

  windowWidth = window.innerWidth;

  NavCollapsedMob = output();

  // ================================================
  // 4. INICIALIZAR EL MENÚ
  // ================================================

  ngOnInit(): void {

    this.cargarMenusAutorizados();

  }

  // ================================================
  // 5. CONSULTAR LOS MENÚS DEL USUARIO AUTENTICADO
  // ================================================

  cargarMenusAutorizados(): void {

    this.menuService.obtenerMenusPropios().subscribe({
      next: menus => this.construirMenuLateral(menus),
      error: () => { this.navigations = []; }
    });
  }

  // ================================================
  // 6. CONSTRUIR EL MENÚ LATERAL
  // ================================================

  private construirMenuLateral(
    menus: Menu[]
  ): void {

    /**
     * Guardar las rutas autorizadas.
     *
     * El backend utiliza /inicio/historias,
     * mientras que Angular tiene configurado
     * /inicio/historias-medicas.
     *
     * Se corrige esa diferencia sin modificar
     * las rutas existentes del proyecto.
     */

    const rutasAutorizadas = new Set(
      menus
        .filter(menu => menu.activo)
        .map(menu => {

          if (menu.code === 'historias') {
            return '/inicio/historias-medicas';
          }

          return menu.url;

        })
    );

    /**
     * Mantener la estructura original de
     * navigation.ts y filtrar únicamente
     * las opciones autorizadas por MySQL.
     *
     * De esta manera conservamos los iconos,
     * nombres, grupos y estilos existentes.
     */

    this.navigations = NavigationItems
      .map(grupo => ({

        ...grupo,

        children: (grupo.children || [])
          .filter(item =>
            !!item.url &&
            rutasAutorizadas.has(item.url)
          )

      }))
      .filter(grupo =>
        grupo.children.length > 0
      );

    console.log(
      'Menú lateral construido:',
      this.navigations
    );

  }

  // ================================================
  // 7. CONTROL DEL MENÚ ACTIVO
  // ================================================

  fireOutClick(): void {

    let current_url = this.location.path();

    if (this.location['_baseHref']) {

      current_url =
        this.location['_baseHref'] +
        this.location.path();

    }

    const link =
      "a.nav-link[ href='" + current_url + "' ]";

    const ele = document.querySelector(link);

    if (ele !== null && ele !== undefined) {

      const parent = ele.parentElement;

      const up_parent =
        parent.parentElement.parentElement;

      const last_parent =
        up_parent.parentElement;

      if (
        parent.classList.contains(
          'pcoded-hasmenu'
        )
      ) {

        parent.classList.add('pcoded-trigger');
        parent.classList.add('active');

      } else if (
        up_parent.classList.contains(
          'pcoded-hasmenu'
        )
      ) {

        up_parent.classList.add('pcoded-trigger');
        up_parent.classList.add('active');

      } else if (
        last_parent.classList.contains(
          'pcoded-hasmenu'
        )
      ) {

        last_parent.classList.add('pcoded-trigger');
        last_parent.classList.add('active');

      }

    }

  }

}
