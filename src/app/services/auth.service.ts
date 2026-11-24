
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { BackendService } from './backend.service';
import { environment } from 'src/environments/environment';

// Datos que devuelve Spring Boot al iniciar sesión.
export interface LoginResponse {
  token: string;
  tokenType: string;
  usuarioId: number;
  username: string;
  perfilId: number;
  perfil: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly aviso = signal('');
  readonly avisoAcceso = this.aviso.asReadonly();

  mostrarAccesoDenegado(): void {
    this.aviso.set('No tienes permiso para esta operación.');
  }

  limpiarAviso(): void {
    this.aviso.set('');
  }

  validarSesion() {
    return this.backendService.get(environment.apiUrlAuth, 'auth', 'validar');
  }


  constructor(
    private backendService: BackendService
  ) {}

  // ============================================
  // INICIAR SESIÓN
  // ============================================

  iniciarSesion(
    username: string,
    password: string
  ): Observable<LoginResponse> {

    return this.backendService.post<LoginResponse>(
      environment.apiUrlAuth,
      'auth',
      'login',
      {
        username,
        password
      }
    ).pipe(

      tap((respuesta) => {

        if (!respuesta.token) {
          throw new Error(
            'El servidor no devolvió un token JWT.'
          );
        }

        this.limpiarAviso();
        localStorage.setItem(
          'token',
          respuesta.token
        );

        localStorage.setItem(
          'usuarioId',
          String(respuesta.usuarioId)
        );

        localStorage.setItem(
          'username',
          respuesta.username
        );

        localStorage.setItem(
          'perfilId',
          String(respuesta.perfilId)
        );

        localStorage.setItem(
          'perfil',
          respuesta.perfil
        );

      })

    );

  }

  // ============================================
  // CONSULTAR SESIÓN
  // ============================================

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  obtenerUsuarioId(): number | null {
    const id = localStorage.getItem('usuarioId');
    return id ? Number(id) : null;
  }

  obtenerPerfil(): string | null {
    return localStorage.getItem('perfil');
  }

  tieneToken(): boolean {
    return !!this.obtenerToken();
  }

  // ============================================
  // CERRAR SESIÓN
  // ============================================

  cerrarSesion(): void {
    this.limpiarAviso();

    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('username');
    localStorage.removeItem('perfilId');
    localStorage.removeItem('perfil');

  }

}
