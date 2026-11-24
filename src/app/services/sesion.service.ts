import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AuthService } from '../demo/pages/login/service/auth.service';

const AVISO_PREVIO_MS = 2 * 60 * 1000;

/** Vigila el vencimiento del token y cierra la sesión local. */
@Injectable({
  providedIn: 'root'
})
export class SesionService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly modalService = inject(NgbModal);
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  iniciarVigilancia(): void {
    this.detenerVigilancia();
    const usuario = this.authService.obtenerUsuario();
    if (!usuario) {
      return;
    }
    const restante = usuario.exp * 1000 - Date.now();
    if (restante > AVISO_PREVIO_MS) {
      this.temporizadores.push(
        setTimeout(
          () => void Swal.fire('Tu sesión está por vencer', 'La sesión se cerrará en 2 minutos. Guarda tus cambios.', 'info'),
          restante - AVISO_PREVIO_MS
        )
      );
    }
    this.temporizadores.push(setTimeout(() => this.expirar(), Math.max(0, restante)));
  }

  detenerVigilancia(): void {
    this.temporizadores.forEach((temporizador) => clearTimeout(temporizador));
    this.temporizadores = [];
  }

  expirar(): void {
    this.detenerVigilancia();
    this.authService.limpiarSesion();
    this.cerrarModales();
    void this.router.navigate(['/login']);
    void Swal.fire('Sesión finalizada', 'Tu sesión expiró. Inicia sesión nuevamente.', 'warning');
  }

  /** Evita que el fondo de un modal abierto bloquee la pantalla de login. */
  private cerrarModales(): void {
    this.modalService.dismissAll();
    document.querySelectorAll('.modal-backdrop').forEach((fondo) => fondo.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }
}
