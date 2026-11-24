// angular import
import { Component, Input, output } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

/** Componente visual «navegación logo» de la plantilla de la aplicación. */
@Component({
  selector: 'app-nav-logo',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-logo.component.html',
  styleUrls: ['./nav-logo.component.scss']
})
export class NavLogoComponent {
  // public props
  /** Navegación collapse. */
  /** Indica si navegación collapsed. */
  @Input() navCollapsed: boolean;
  NavCollapse = output();
  /** Window width. */
  windowWidth = window.innerWidth;

  // public method
  /** Gestiona la navegación collapse. */
  navCollapse() {
    if (this.windowWidth >= 992) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }
}
