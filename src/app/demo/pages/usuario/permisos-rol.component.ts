import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { UsuarioService, MatrizPermisos, PermisoCatalogo } from './service/usuario.service';
import { mensajeError } from 'src/app/utils/tabla-datos';

/**
 * Matriz de permisos por rol: el administrador asigna o quita permisos sin modificar código.
 * El backend valida cada operación con estos permisos (Spring Security).
 */
@Component({
  selector: 'app-permisos-rol',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './permisos-rol.component.html'
})
export class PermisosRolComponent implements OnInit {
  /** Servicio de usuarios y permisos. */
  private readonly api = inject(UsuarioService);

  /** Matriz cargada. */
  matriz: MatrizPermisos | null = null;
  /** Permisos en edición por rol (clave: perfilId). */
  seleccion: Record<string, Set<string>> = {};
  /** Indica si se está guardando. */
  guardando = false;
  /** Mensaje de error. */
  error = '';
  /** Mensaje de confirmación. */
  aviso = '';

  /** Carga la matriz. */
  ngOnInit(): void {
    this.cargar();
  }

  /** Consulta la matriz de permisos. */
  cargar(): void {
    this.api.permisos().subscribe({
      next: m => this.aplicar(m),
      error: e => (this.error = mensajeError(e, 'No fue posible consultar los permisos.'))
    });
  }

  /** Módulos del catálogo en orden. */
  get modulos(): string[] {
    return [...new Set((this.matriz?.permisos ?? []).map(p => p.modulo))];
  }

  /**
   * @param modulo módulo.
   * @returns permisos del módulo.
   */
  permisosDe(modulo: string): PermisoCatalogo[] {
    return (this.matriz?.permisos ?? []).filter(p => p.modulo === modulo);
  }

  /**
   * @param perfilId rol.
   * @param codigo permiso.
   * @returns true si el rol tiene el permiso en edición.
   */
  tiene(perfilId: number, codigo: string): boolean {
    return this.seleccion[perfilId]?.has(codigo) ?? false;
  }

  /**
   * @param perfilId rol.
   * @param codigo permiso.
   * @returns true si el permiso es obligatorio para el rol Administrador.
   */
  bloqueado(perfilId: number, codigo: string): boolean {
    return perfilId === 1 && (this.matriz?.obligatoriosAdministrador ?? []).includes(codigo);
  }

  /**
   * Marca o desmarca un permiso en edición.
   *
   * @param perfilId rol.
   * @param codigo permiso.
   */
  alternar(perfilId: number, codigo: string): void {
    const s = this.seleccion[perfilId];
    if (s.has(codigo)) s.delete(codigo); else s.add(codigo);
  }

  /**
   * @param perfilId rol.
   * @returns true si hay cambios sin guardar.
   */
  cambiado(perfilId: number): boolean {
    const original = new Set(this.matriz?.asignaciones[perfilId] ?? []);
    const actual = this.seleccion[perfilId] ?? new Set<string>();
    return original.size !== actual.size || [...actual].some(c => !original.has(c));
  }

  /**
   * Guarda los permisos de un rol, previa confirmación.
   *
   * @param perfilId rol.
   * @param nombre nombre del rol.
   */
  guardar(perfilId: number, nombre: string): void {
    Swal.fire({
      title: `¿Actualizar permisos de ${nombre}?`,
      text: 'Los usuarios de este rol tendrán los nuevos permisos desde su siguiente operación. El cambio queda en la trazabilidad.',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.guardando = true;
      this.error = '';
      this.api.asignarPermisos(perfilId, [...this.seleccion[perfilId]]).subscribe({
        next: m => { this.guardando = false; this.aplicar(m); this.aviso = `Permisos de ${nombre} actualizados.`; },
        error: e => { this.guardando = false; this.error = mensajeError(e, 'No fue posible guardar los permisos.'); }
      });
    });
  }

  /**
   * Toma la matriz del backend como estado de edición.
   *
   * @param m matriz.
   */
  private aplicar(m: MatrizPermisos): void {
    this.matriz = m;
    this.seleccion = {};
    m.perfiles.forEach(p => (this.seleccion[p.perfilId] = new Set(m.asignaciones[p.perfilId] ?? [])));
  }
}
