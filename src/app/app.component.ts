import { Component } from '@angular/core';

/**
 * Componente raiz de la aplicacion.
 *
 * Su plantilla (app.component.html) contiene la barra lateral de navegacion
 * que se ve en TODAS las paginas, y el <router-outlet> donde Angular dibuja
 * el componente que corresponda segun la ruta actual.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  /** Titulo de la aplicacion, mostrado en el encabezado de la barra lateral. */
  titulo = 'Clínica Veterinaria';

  /** Indica si la barra lateral esta oculta (boton de menu). En pantallas pequenas empieza oculta. */
  menuOculto = window.innerWidth <= 860;

  /** Muestra u oculta la barra lateral. */
  alternarMenu(): void {
    this.menuOculto = !this.menuOculto;
  }
}
