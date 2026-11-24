// angular import
import { Component, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavLeftComponent } from './nav-left/nav-left.component';
import { NavRightComponent } from './nav-right/nav-right.component';

/** Componente visual «navegación bar» de la plantilla de la aplicación. */
@Component({
  selector: 'app-nav-bar',
  imports: [SharedModule, NavLeftComponent, NavRightComponent, RouterModule, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent {
  // public props
  /** Navegación collapsed móvil. */
  readonly NavCollapsedMob = output();
  /** Indica si navegación collapsed móvil. */
  navCollapsedMob;
  /** Header style. */
  headerStyle: string;
  /** Indica si menú class. */
  menuClass: boolean;
  /** Collapse style. */
  collapseStyle: string;

  // constructor
  /** Crea la instancia con sus dependencias inyectadas. */
  constructor() {
    this.navCollapsedMob = false;
    this.headerStyle = '';
    this.menuClass = false;
    this.collapseStyle = 'none';
  }

  // public method
  /** Alterna móvil option. */
  toggleMobOption() {
    this.menuClass = !this.menuClass;
    this.headerStyle = this.menuClass ? 'none' : '';
    this.collapseStyle = this.menuClass ? 'block' : 'none';
  }

  // this is for eslint rule
  /**
   * Gestiona key down.
   *
   * @param event evento del navegador.
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  /** Cierra menú. */
  closeMenu() {
      document.querySelector<HTMLElement>('app-navigation.pcoded-navbar')?.classList.remove('mob-open');
  }
}
