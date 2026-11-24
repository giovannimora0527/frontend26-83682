import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap, timeout } from 'rxjs';
import { AuthRs } from 'src/app/models/auth-rs';
import { LoginRs } from 'src/app/models/login-rs';
import { TokenRq } from 'src/app/models/token-rq';
import { BackendService } from 'src/app/services/backend.service';
import { Rol } from 'src/app/models/estados';
import { getJwtMenus, getJwtPayload, JwtPayload } from 'src/app/utils/jwt.util';
import { environment } from 'src/environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = 'auth';
  static readonly TOKEN_KEY = 'token';

  constructor(private readonly backendService: BackendService) { }

  login(data: LoginRequest): Observable<AuthRs> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'login', data);
  }

  validateOtp(data: TokenRq): Observable<LoginRs> {
    return this.backendService
      .post<LoginRs>(environment.apiUrlAuth, this.api, 'validate-token', data)
      .pipe(tap((resp) => this.guardarSesion(resp?.token)));
  }

  // TODO: recuperar contraseña. El backend no expone auth/recover-password y el examen no lo pide.
  // recuperarPassword(email: string): Observable<unknown> {
  //   return this.backendService.post(environment.apiUrlAuth, this.api, 'recover-password', { email });
  // }

  guardarSesion(token: string | null | undefined): void {
    if (!token) {
      throw new Error('La respuesta no contiene un token JWT');
    }
    sessionStorage.setItem(AuthService.TOKEN_KEY, token);
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem(AuthService.TOKEN_KEY);
  }

  /** Claims del token actual, o null si no hay token o no se puede decodificar. */
  obtenerUsuario(): JwtPayload | null {
    try {
      return getJwtPayload();
    } catch {
      return null;
    }
  }

  tieneRol(...roles: Rol[]): boolean {
    const rol = this.obtenerUsuario()?.rol;
    return roles.some((permitido) => permitido === rol);
  }

  tieneMenu(code: string): boolean {
    try {
      return getJwtMenus().some((menu) => menu.activo && menu.code === code);
    } catch {
      return false;
    }
  }

  estaVencido(): boolean {
    const usuario = this.obtenerUsuario();
    return !usuario || usuario.exp * 1000 <= Date.now();
  }

  isAuthenticated(): boolean {
    return !this.estaVencido();
  }

  limpiarSesion(): void {
    sessionStorage.removeItem(AuthService.TOKEN_KEY);
  }

  /** Invalida la sesión en el backend; la local se limpia aunque la llamada falle o no responda. */
  cerrarSesion(): Observable<void> {
    return this.backendService.post<unknown>(environment.apiUrlAuth, this.api, 'cerrar-sesion', null).pipe(
      timeout(5000),
      catchError(() => of(undefined)),
      map(() => undefined),
      tap(() => this.limpiarSesion())
    );
  }
}
