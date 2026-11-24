import { Component, OnDestroy, ViewEncapsulation, inject, input } from '@angular/core';
import { Spinkit } from './spinkits';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

/** Componente visual «spinner» de la plantilla de la aplicación. */
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss', './spinkit-css/sk-line-material.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SpinnerComponent implements OnDestroy {
  /** Dependencia inyectada (Router). */
  private router = inject(Router);

  /** Indica si spinner visible. */
  isSpinnerVisible = true;
  /** Spinkit. */
  Spinkit = Spinkit;
  /** Background color. */
  readonly backgroundColor = input('#1dc4e9');
  /** Spinner. */
  readonly spinner = input(Spinkit.skLine);
  /** Crea la instancia con sus dependencias inyectadas. */
  constructor() {
    this.router.events.subscribe(
      (event) => {
        if (event instanceof NavigationStart) {
          this.isSpinnerVisible = true;
        } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.isSpinnerVisible = false;
        }
      },
      () => {
        this.isSpinnerVisible = false;
      }
    );
  }

  /** Libera recursos (suscripciones y temporizadores) al destruir el componente. */
  ngOnDestroy(): void {
    this.isSpinnerVisible = false;
  }
}
