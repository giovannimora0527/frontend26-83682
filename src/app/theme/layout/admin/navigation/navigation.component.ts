// angular import
import { Component, output } from '@angular/core';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavLogoComponent } from './nav-logo/nav-logo.component';
import { NavContentComponent } from './nav-content/nav-content.component';

/** Componente visual «navigation» de la plantilla de la aplicación. */
@Component({
  selector: 'app-navigation',
  imports: [SharedModule, NavLogoComponent, NavContentComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  // public props
  /** Navegación collapse. */
  NavCollapse = output();
  /** Navegación collapsed móvil. */
  NavCollapsedMob = output();
  /** Indica si navegación collapsed. */
  navCollapsed: boolean;
  /** Indica si navegación collapsed móvil. */
  navCollapsedMob: boolean;
  /** Window width. */
  windowWidth: number;

  // constructor
  /** Crea la instancia con sus dependencias inyectadas. */
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  // public method
  /** Gestiona la navegación collapse. */
  navCollapse() {
    if (this.windowWidth >= 992) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }

  /** Gestiona la navegación collapse móvil. */
  navCollapseMob() {
    if (this.windowWidth < 992) {
      this.NavCollapsedMob.emit();
    }
  }
}
