
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  username = '';
  password = '';

  cargando = false;
  mostrarPassword = false;
  mensajeError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  iniciarSesion(): void {

    this.mensajeError = '';

    if (
      !this.username.trim() ||
      !this.password
    ) {
      this.mensajeError =
        'Debes ingresar tu usuario y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.iniciarSesion(
      this.username.trim(),
      this.password
    ).subscribe({

      next: () => {

        this.cargando = false;

        // Entrar al panel principal.
        this.router.navigateByUrl('/inicio');

      },

      error: (error: HttpErrorResponse) => {

        this.cargando = false;

        if (error.status === 401) {

          this.mensajeError =
            'Usuario o contraseña incorrectos.';

        } else if (error.status === 403) {
          this.mensajeError = 'Tu perfil no está habilitado para ingresar.';
        } else if (error.status === 0) {

          this.mensajeError =
            'No hay conexión con el servidor.';

        } else {

          this.mensajeError =
            'No fue posible iniciar sesión.';

        }

      }

    });

  }

}
