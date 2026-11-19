
/**
 * CLÍNICA VETERINARIA - UNIMINUTO
 * Barra superior derecha del sistema.
 *
 * Permite mostrar el usuario conectado
 * y cerrar su sesión de forma segura.
 */

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig]
})
export class NavRightComponent {

  // Servicio que administra el inicio y cierre de sesión.
  private readonly authService = inject(AuthService);

  // Permite cambiar de pantalla.
  private readonly router = inject(Router);

  constructor() {
    const config = inject(NgbDropdownConfig);
    config.placement = 'bottom-right';
  }

  /**
   * Recupera el nombre del usuario conectado.
   */
  get nombreUsuario(): string {
    return localStorage.getItem('username') || 'Usuario';
  }

  /**
   * Cierra la sesión actual.
   *
   * 1. Elimina los datos de autenticación.
   * 2. Redirige a la pantalla de login.
   * 3. Evita regresar con el botón Atrás.
   */
  cerrarSesion(): void {

    this.authService.cerrarSesion();

    this.router.navigateByUrl('/login', {
      replaceUrl: true
    });

  }
}
