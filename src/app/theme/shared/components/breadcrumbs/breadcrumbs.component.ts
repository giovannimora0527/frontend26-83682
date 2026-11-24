// Angular Import
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, Event } from '@angular/router';
import { Title } from '@angular/platform-browser';

// project import
import { NavigationItem, NavigationItems } from 'src/app/theme/layout/admin/navigation/navigation';
import { SharedModule } from '../../shared.module';

/** Modelo de datos «titleType» que se intercambia con el backend. */
interface titleType {
  // eslint-disable-next-line
  /** Ruta de navegación. */
  url: string | boolean | any | undefined;
  /** Título visible. */
  title: string;
  /** Indica si se muestra en las migas de pan. */
  breadcrumbs: unknown;
  /** Tipo de elemento del menú (item, collapse o group). */
  type: string;
}

/** Componente visual «breadcrumbs» de la plantilla de la aplicación. */
@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  /** Dependencia inyectada (Router). */
  private route = inject(Router);
  /** Dependencia inyectada (Title). */
  private titleService = inject(Title);

  // public props
  /** Tipo de elemento del menú (item, collapse o group). */
  @Input() type: string;

  /** Lista de navigations. */
  navigations: NavigationItem[];
  /** Lista de breadcrumb list. */
  breadcrumbList: string[] = [];
  /** Lista de navigation list. */
  navigationList!: titleType[];

  // constructor
  /** Crea la instancia con sus dependencias inyectadas. */
  constructor() {
    this.navigations = NavigationItems;
    this.type = 'theme1';
    this.setBreadcrumb();
  }

  // public method
  /** Establece breadcrumb. */
  setBreadcrumb() {
    this.route.events.subscribe((router: Event) => {
      if (router instanceof NavigationEnd) {
        const activeLink = router.url;
        const breadcrumbList = this.filterNavigation(this.navigations, activeLink);
        this.navigationList = breadcrumbList;
        this.titleService.setTitle('Clinica Veterinaria | Uniminuto');
      }
    });
  }

  /**
   * Filter navigation.
   *
   * @param navItems navegación items.
   * @param activeLink active link.
   * @returns resultado de filter navigation.
   */
  filterNavigation(navItems: NavigationItem[], activeLink: string): titleType[] {
    for (const navItem of navItems) {
      if (navItem.type === 'item' && 'url' in navItem && navItem.url === activeLink) {
        return [
          {
            url: 'url' in navItem ? navItem.url : false,
            title: navItem.title,
            breadcrumbs: 'breadcrumbs' in navItem ? navItem.breadcrumbs : true,
            type: navItem.type
          }
        ];
      }
      if ((navItem.type === 'group' || navItem.type === 'collapse') && 'children' in navItem) {
        const breadcrumbList = this.filterNavigation(navItem.children!, activeLink);
        if (breadcrumbList.length > 0) {
          breadcrumbList.unshift({
            url: 'url' in navItem ? navItem.url : false,
            title: navItem.title,
            breadcrumbs: 'breadcrumbs' in navItem ? navItem.breadcrumbs : true,
            type: navItem.type
          });
          return breadcrumbList;
        }
      }
    }
    return [];
  }
}
