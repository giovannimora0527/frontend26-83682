import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { BackendService } from './backend.service';
import { environment } from 'src/environments/environment';

// Sesión que devuelve Spring Boot cuando el código de verificación es correcto.
/** Modelo de datos «LoginResponse» que se intercambia con el backend. */
export interface LoginResponse {
  /** Token JWT de la sesión. */
  token: string;
  /** Tipo de token (Bearer). */
  tokenType: string;
  /** Identificador de usuario. */
  usuarioId: number;
  /** Nombre de usuario. */
  username: string;
  /** Identificador de perfil. */
  perfilId: number;
  /** Perfil (rol) del usuario. */
  perfil: string;
  /** Permisos del rol (control de acceso por permisos; el backend los valida en cada endpoint). */
  permisos?: string[];
}

// Respuesta del primer paso (usuario y contraseña) o de la recuperación de contraseña.
/** Modelo de datos «DesafioResponse» que se intercambia con el backend. */
export interface DesafioResponse {
  /** Indica si el backend exige el segundo paso (código por correo). */
  verificacion: boolean;
  /** Identificador del desafío de verificación por correo. */
  desafio: string | null;
  /** Correo electrónico. */
  correo: string | null;
  /** Duración en minutos. */
  minutos: number;
  /** Sesión iniciada directamente cuando no se exige verificación. */
  sesion: LoginResponse | null;
}

/** Servicio de autenticación: inicio de sesión en dos pasos (contraseña + código por correo), recuperación de contraseña y manejo del token JWT en el navegador. */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Aviso general que se muestra en la pantalla de inicio de sesión. */
  private readonly aviso = signal('');
  /** Aviso que se muestra cuando el perfil no tiene permiso para una pantalla. */
  readonly avisoAcceso = this.aviso.asReadonly();

  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param backendService servicio backend.
   */
  constructor(private backendService: BackendService) {}

  /** Muestra el aviso de acceso denegado. */
  mostrarAccesoDenegado(): void {
    this.aviso.set('No tienes permiso para esta operación.');
  }

  /** Oculta el aviso de acceso denegado. */
  limpiarAviso(): void {
    this.aviso.set('');
  }

  /**
   * Valida en el backend que el token guardado siga activo.
   *
   * @returns observable con la respuesta del backend.
   */
  validarSesion() {
    return this.backendService.get<LoginResponse>(environment.apiUrlAuth, 'auth', 'validar')
      .pipe(tap(s => localStorage.setItem('permisos', JSON.stringify(s?.permisos ?? []))));
  }

  /**
   * Permisos del usuario autenticado (se actualizan al validar la sesión).
   *
   * @returns códigos de permiso.
   */
  obtenerPermisos(): string[] {
    try {
      return JSON.parse(localStorage.getItem('permisos') ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  /**
   * Indica si el usuario tiene un permiso. Solo controla la interfaz: el backend lo valida en cada operación.
   *
   * @param permiso código del permiso.
   * @returns true si lo tiene.
   */
  tienePermiso(permiso: string): boolean {
    return this.obtenerPermisos().includes(permiso);
  }

  /**
   * Indica si el usuario tiene alguno de los permisos.
   *
   * @param permisos códigos de permiso.
   * @returns true si tiene al menos uno.
   */
  tieneAlguno(...permisos: string[]): boolean {
    const propios = this.obtenerPermisos();
    return permisos.some(p => propios.includes(p));
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

  /**
   * Paso 2: envía el código recibido por correo y, si es correcto, guarda la sesión.
   *
   * @param desafio desafio.
   * @param codigo código.
   * @returns observable con la respuesta del backend.
   */
  verificarCodigo(desafio: string, codigo: string): Observable<LoginResponse> {
    return this.backendService.post<LoginResponse>(environment.apiUrlAuth, 'auth', 'verificar', { desafio, codigo })
      .pipe(tap(sesion => this.guardarSesion(sesion)));
  }

  /**
   * Solicita un nuevo código para el mismo desafío (el anterior queda inválido).
   *
   * @param desafio desafio.
   * @returns observable con la respuesta del backend.
   */
  reenviarCodigo(desafio: string): Observable<DesafioResponse> {
    return this.backendService.post<DesafioResponse>(environment.apiUrlAuth, 'auth', 'reenviar', { desafio });
  }

  // ============================================
  // RECUPERAR CONTRASEÑA
  // ============================================

  /**
   * Inicia la recuperación de contraseña enviando un código al correo registrado.
   *
   * @param usuario usuario.
   * @returns observable con la respuesta del backend.
   */
  recuperarClave(usuario: string): Observable<DesafioResponse> {
    return this.backendService.post<DesafioResponse>(environment.apiUrlAuth, 'auth', 'recuperar', { usuario });
  }

  /**
   * Cambia la contraseña con el código de recuperación.
   *
   * @param desafio desafio.
   * @param codigo código.
   * @param nuevaClave nueva clave.
   * @returns observable con la respuesta del backend.
   */
  restablecerClave(desafio: string, codigo: string, nuevaClave: string): Observable<void> {
    return this.backendService.post<void>(environment.apiUrlAuth, 'auth', 'restablecer', { desafio, codigo, nuevaClave });
  }

  // ============================================
  // CONSULTAR SESIÓN
  // ============================================

  /**
   * Obtiene el token JWT guardado en el navegador.
   *
   * @returns resultado de obtener token.
   */
  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene el identificador del usuario autenticado.
   *
   * @returns resultado de obtener usuario identificador.
   */
  obtenerUsuarioId(): number | null {
    const id = localStorage.getItem('usuarioId');
    return id ? Number(id) : null;
  }

  /**
   * Obtiene el perfil (rol) del usuario autenticado.
   *
   * @returns resultado de obtener perfil.
   */
  obtenerPerfil(): string | null {
    return localStorage.getItem('perfil');
  }

  /**
   * Indica si hay una sesión guardada en el navegador.
   *
   * @returns true si se cumple la condición.
   */
  tieneToken(): boolean {
    return !!this.obtenerToken();
  }

  // ============================================
  // CERRAR SESIÓN
  // ============================================

  /** Cierra la sesión en el backend y borra los datos guardados en el navegador. */
  cerrarSesion(): void {
    this.limpiarAviso();
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('username');
    localStorage.removeItem('perfilId');
    localStorage.removeItem('perfil');
    localStorage.removeItem('permisos');
  }

  /**
   * Guarda token, usuario y perfil en el almacenamiento local.
   *
   * @param respuesta respuesta.
   */
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
    localStorage.setItem('permisos', JSON.stringify(respuesta.permisos ?? []));
  }
}
