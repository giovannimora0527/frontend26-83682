import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService, DesafioResponse } from '../../../services/auth.service';

/** Pantallas del inicio de sesión. */
type Paso = 'credenciales' | 'verificacion' | 'recuperar' | 'restablecer';

/** Pantalla de inicio de sesión en dos pasos (usuario/contraseña y código enviado al correo) con recuperación de contraseña. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {

  /** Imagen del panel izquierdo (si no existe se muestra el degradado azul). */
  readonly imagenFondo = 'url(assets/images/login-veterinaria.jpg)';

  /** Paso visible del flujo: credenciales, verificación, recuperación o restablecimiento. */
  paso: Paso = 'credenciales';
  /** Nombre de usuario. */
  username = '';
  /** Contraseña ingresada (nunca se guarda en el navegador). */
  password = '';
  /** Código de 6 caracteres recibido por correo. */
  codigo = '';
  /** Usuario o correo para recuperar la contraseña. */
  usuarioRecuperar = '';
  /** Nueva contraseña. */
  nuevaClave = '';
  /** Confirmación de la nueva contraseña. */
  confirmarClave = '';
  /** Indica si la contraseña se muestra en texto plano. */
  mostrarPassword = false;

  /** Identificador del desafío de verificación por correo. */
  desafio: string | null = null;
  /** Correo electrónico. */
  correo: string | null = null;
  /** Segundos que faltan para poder reenviar el código. */
  segundosReenvio = 0;

  /** Indica si se está cargando. */
  cargando = false;
  /** Mensaje de error mostrado al usuario. */
  mensajeError = '';
  /** Mensaje informativo mostrado al usuario. */
  mensajeInfo = '';

  /** Temporizador de la cuenta regresiva de reenvío. */
  private temporizador?: ReturnType<typeof setInterval>;

  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param authService servicio auth.
   * @param router enrutador de Angular.
   */
  constructor(private authService: AuthService, private router: Router) {}

  /** Libera recursos (suscripciones y temporizadores) al destruir el componente. */
  ngOnDestroy(): void {
    clearInterval(this.temporizador);
  }

  // ==========================================
  // PASO 1: USUARIO Y CONTRASEÑA
  // ==========================================

  /** Valida usuario y contraseña y pasa al paso de verificación por correo. */
  iniciarSesion(): void {
    this.limpiarMensajes();
    if (!this.username.trim() || !this.password) {
      this.mensajeError = 'Debes ingresar tu usuario y contraseña.';
      return;
    }
    this.cargando = true;
    this.authService.iniciarSesion(this.username.trim(), this.password).subscribe({
      next: respuesta => {
        this.cargando = false;
        if (respuesta.sesion) {
          this.router.navigateByUrl('/inicio');
          return;
        }
        this.irAVerificacion(respuesta, 'verificacion');
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = this.mensaje(error, {
          401: 'Usuario o contraseña incorrectos.',
          403: 'Tu perfil no está habilitado para ingresar.'
        });
      }
    });
  }

  // ==========================================
  // PASO 2: CÓDIGO DE VERIFICACIÓN
  // ==========================================

  /** Valida el código recibido por correo y entra al sistema. */
  verificar(): void {
    this.limpiarMensajes();
    const codigo = this.codigo.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(codigo) || !this.desafio) {
      this.mensajeError = 'Ingresa el código de 6 caracteres que llegó a tu correo.';
      return;
    }
    this.cargando = true;
    this.authService.verificarCodigo(this.desafio, codigo).subscribe({
      next: () => {
        this.cargando = false;
        this.password = '';
        this.router.navigateByUrl('/inicio');
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = this.mensaje(error, {});
      }
    });
  }

  /** Reenvía el código de verificación al correo. */
  reenviar(): void {
    if (!this.desafio || this.segundosReenvio > 0) return;
    this.limpiarMensajes();
    this.cargando = true;
    this.authService.reenviarCodigo(this.desafio).subscribe({
      next: respuesta => {
        this.cargando = false;
        this.codigo = '';
        this.irAVerificacion(respuesta, this.paso);
        this.mensajeInfo = 'Te enviamos un nuevo código.';
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = this.mensaje(error, {});
      }
    });
  }

  // ==========================================
  // RECUPERAR CONTRASEÑA
  // ==========================================

  /** Muestra el formulario de recuperación de contraseña. */
  abrirRecuperacion(): void {
    this.limpiarMensajes();
    this.usuarioRecuperar = this.username.trim();
    this.paso = 'recuperar';
  }

  /** Solicita el código de recuperación de contraseña. */
  solicitarRecuperacion(): void {
    this.limpiarMensajes();
    if (!this.usuarioRecuperar.trim()) {
      this.mensajeError = 'Ingresa tu usuario o tu correo electrónico.';
      return;
    }
    this.cargando = true;
    this.authService.recuperarClave(this.usuarioRecuperar.trim()).subscribe({
      next: respuesta => {
        this.cargando = false;
        this.nuevaClave = '';
        this.confirmarClave = '';
        this.irAVerificacion(respuesta, 'restablecer');
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = this.mensaje(error, {});
      }
    });
  }

  /** Cambia la contraseña con el código de recuperación. */
  restablecer(): void {
    this.limpiarMensajes();
    const codigo = this.codigo.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(codigo) || !this.desafio) {
      this.mensajeError = 'Ingresa el código de 6 caracteres que llegó a tu correo.';
      return;
    }
    if (this.nuevaClave.length < 8 || !/[A-Za-z]/.test(this.nuevaClave) || !/\d/.test(this.nuevaClave)) {
      this.mensajeError = 'La nueva contraseña debe tener al menos 8 caracteres, con letras y números.';
      return;
    }
    if (this.nuevaClave !== this.confirmarClave) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }
    this.cargando = true;
    this.authService.restablecerClave(this.desafio, codigo, this.nuevaClave).subscribe({
      next: () => {
        this.cargando = false;
        this.volver();
        this.mensajeInfo = 'Tu contraseña se actualizó. Ya puedes iniciar sesión.';
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = this.mensaje(error, {});
      }
    });
  }

  /** Vuelve al formulario de usuario y contraseña. */
  volver(): void {
    clearInterval(this.temporizador);
    this.segundosReenvio = 0;
    this.limpiarMensajes();
    this.codigo = '';
    this.desafio = null;
    this.paso = 'credenciales';
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Muestra el paso de verificación e inicia la cuenta regresiva de reenvío.
   *
   * @param respuesta respuesta.
   * @param paso paso.
   */
  private irAVerificacion(respuesta: DesafioResponse, paso: Paso): void {
    this.desafio = respuesta.desafio;
    this.correo = respuesta.correo;
    this.codigo = '';
    this.paso = paso;
    this.segundosReenvio = 30;
    clearInterval(this.temporizador);
    this.temporizador = setInterval(() => {
      this.segundosReenvio = Math.max(0, this.segundosReenvio - 1);
      if (this.segundosReenvio === 0) clearInterval(this.temporizador);
    }, 1000);
  }

  /** Limpia los mensajes de error e información. */
  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeInfo = '';
  }

  /**
   * Convierte un error HTTP en un mensaje según su código de estado.
   *
   * @param error error recibido del backend.
   * @param porEstado por estado.
   * @returns texto resultante.
   */
  private mensaje(error: HttpErrorResponse, porEstado: Record<number, string>): string {
    if (error.status === 0) return 'No hay conexión con el servidor.';
    return error.error?.mensaje ?? porEstado[error.status] ?? 'No fue posible completar la operación.';
  }
}
