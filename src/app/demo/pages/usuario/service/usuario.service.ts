import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Usuario del sistema tal como lo devuelve el backend (sin contraseña). */
export interface UsuarioSistema {
  /** Identificador único del registro. */
  id: number;
  /** Nombre de usuario. */
  username: string;
  /** Rol del usuario. */
  rol: number;
  /** Perfil (rol) del usuario. */
  perfil: string;
  /** Correo electrónico. */
  email: string;
  /** Indica si el registro está activo. */
  activo: boolean;
  /** Fecha creación. */
  fechaCreacion: string;
}

/** Modelo de datos «Perfil» que se intercambia con el backend. */
export interface Perfil {
  /** Identificador de perfil. */
  perfilId: number;
  /** Nombre. */
  nombre: string;
  /** Indica si el registro está activo. */
  activo: boolean;
}

/** Datos para crear o actualizar: `rol` es el id del perfil; `password` es opcional al editar. */
export interface UsuarioRq {
  /** Identificador único del registro (opcional). */
  id?: number;
  /** Nombre de usuario. */
  username: string;
  /** Contraseña ingresada (nunca se guarda en el navegador) (opcional). */
  password?: string;
  /** Rol del usuario. */
  rol: number | null;
  /** Correo electrónico. */
  email: string;
  /** Indica si el registro está activo. */
  activo: boolean;
}

/** Servicio de usuario: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http = inject(HttpClient);
  /** Ruta del recurso en la API del backend. */
  private readonly api = environment.apiUrlAuth + '/usuario';

  /**
   * Lista usuario mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  listar(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(this.api + '/listar');
  }

  /**
   * Perfiles mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  perfiles(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(this.api + '/perfiles');
  }

  /**
   * Crea usuario mediante la API del backend.
   *
   * @param datos datos a enviar.
   * @returns observable con la respuesta del backend.
   */
  crear(datos: UsuarioRq): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.api + '/guardar', datos);
  }

  /**
   * Actualiza usuario mediante la API del backend.
   *
   * @param datos datos a enviar.
   * @returns observable con la respuesta del backend.
   */
  actualizar(datos: UsuarioRq): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.api + '/actualizar', datos);
  }

  /**
   * Matriz de permisos: roles, catálogo y asignaciones.
   *
   * @returns observable con la matriz.
   */
  permisos(): Observable<MatrizPermisos> {
    return this.http.get<MatrizPermisos>(this.api + '/permisos');
  }

  /**
   * Reemplaza los permisos de un rol (aplican desde la siguiente operación de sus usuarios).
   *
   * @param perfilId rol.
   * @param permisos códigos de permiso.
   * @returns observable con la matriz actualizada.
   */
  asignarPermisos(perfilId: number, permisos: string[]): Observable<MatrizPermisos> {
    return this.http.put<MatrizPermisos>(`${this.api}/permisos/${perfilId}`, { permisos });
  }

  /**
   * Consulta el log de auditoría.
   *
   * @param filtros desde, hasta, accion, usuario y pagina.
   * @returns observable con la página del log.
   */
  auditoria(filtros: Record<string, string | number>): Observable<PaginaAuditoria> {
    const params: Record<string, string> = {};
    Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) params[k] = String(v); });
    return this.http.get<PaginaAuditoria>(this.api + '/auditoria', { params });
  }
}

/** Permiso del catálogo. */
export interface PermisoCatalogo {
  /** Código (p. ej. CITA_GESTIONAR). */
  codigo: string;
  /** Módulo al que pertenece. */
  modulo: string;
  /** Descripción. */
  descripcion: string;
}

/** Matriz de permisos por rol. */
export interface MatrizPermisos {
  /** Roles. */
  perfiles: Perfil[];
  /** Catálogo de permisos. */
  permisos: PermisoCatalogo[];
  /** Códigos asignados por rol (clave: perfilId). */
  asignaciones: Record<string, string[]>;
  /** Permisos que el rol Administrador no puede perder. */
  obligatoriosAdministrador: string[];
}

/** Registro del log de auditoría. */
export interface RegistroAuditoria {
  /** Identificador. */
  id: number;
  /** Usuario. */
  username: string | null;
  /** Rol. */
  perfil: string | null;
  /** Acción. */
  accion: string;
  /** Entidad afectada. */
  entidad: string | null;
  /** Identificador de la entidad. */
  entidadId: number | null;
  /** Detalle. */
  detalle: string | null;
  /** IP de origen. */
  ip: string | null;
  /** Fecha y hora. */
  fecha: string;
}

/** Página del log de auditoría. */
export interface PaginaAuditoria {
  /** Registros. */
  filas: RegistroAuditoria[];
  /** Página actual. */
  pagina: number;
  /** Indica si hay más páginas. */
  hayMas: boolean;
  /** Acciones registradas (filtro). */
  acciones: string[];
}
