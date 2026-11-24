import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { BackendService } from './backend.service';
import { environment } from 'src/environments/environment';

// Sesión que devuelve Spring Boot cuando el código de verificación es correcto.
export interface LoginResponse {
  token: string;
  tokenType: string;
  usuarioId: number;
  username: string;
  perfilId: number;
  perfil: string;
}

// Respuesta del primer paso (usuario y contraseña) o de la recuperación de contraseña.
export interface DesafioResponse {
  verificacion: boolean;
  desafio: string | null;
  correo: string | null;
  minutos: number;
  sesion: LoginResponse | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly aviso = signal('');
  readonly avisoAcceso = this.aviso.asReadonly();

  constructor(private backendService: BackendService) {}

  mostrarAccesoDenegado(): void {
    this.aviso.set('No tienes permiso para esta operación.');
  }

  limpiarAviso(): void {
    this.aviso.set('');
  }

  validarSesion() {
    return this.backendService.get(environment.apiUrlAuth, 'auth', 'validar');
  }

  // ============================================
  // PASO 1: USUARIO Y CONTRASEÑA
  // ============================================

  /** Valida credenciales; el servidor envía un código de 6 caracteres al correo del usuario. */
  iniciarSesion(username: string, password: string): Observable<DesafioResponse> {
    return this.backendService.post<DesafioResponse>(environment.apiUrlAuth, 'auth', 'login', { username, password })
      .pipe(tap(respuesta => {
        // Si la verificación en dos pasos está deshabilitada, la sesión llega directamente.
        if (respuesta.sesion) {
          this.guardarSesion(respuesta.sesion);
        }
      }));
  }

  // ============================================
  // PASO 2: CÓDIGO DE VERIFICACIÓN
  // ============================================

  verificarCodigo(desafio: string, codigo: string): Observable<LoginResponse> {
    return this.backendService.post<LoginResponse>(environment.apiUrlAuth, 'auth', 'verificar', { desafio, codigo })
      .pipe(tap(sesion => this.guardarSesion(sesion)));
  }

  reenviarCodigo(desafio: string): Observable<DesafioResponse> {
    return this.backendService.post<DesafioResponse>(environment.apiUrlAuth, 'auth', 'reenviar', { desafio });
  }

  // ============================================
  // RECUPERAR CONTRASEÑA
  // ============================================

  recuperarClave(usuario: string): Observable<DesafioResponse> {
    return this.backendService.post<DesafioResponse>(environment.apiUrlAuth, 'auth', 'recuperar', { usuario });
  }

  restablecerClave(desafio: string, codigo: string, nuevaClave: string): Observable<void> {
    return this.backendService.post<void>(environment.apiUrlAuth, 'auth', 'restablecer', { desafio, codigo, nuevaClave });
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

  private guardarSesion(respuesta: LoginResponse): void {
    if (!respuesta.token) {
      throw new Error('El servidor no devolvió un token JWT.');
    }
    this.limpiarAviso();
    localStorage.setItem('token', respuesta.token);
    localStorage.setItem('usuarioId', String(respuesta.usuarioId));
    localStorage.setItem('username', respuesta.username);
    localStorage.setItem('perfilId', String(respuesta.perfilId));
    localStorage.setItem('perfil', respuesta.perfil);
  }
}
