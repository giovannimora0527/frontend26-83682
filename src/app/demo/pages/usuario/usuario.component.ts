import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Perfil, UsuarioRq, UsuarioService, UsuarioSistema } from './service/usuario.service';

/**
 * Gestión de usuarios y perfiles (solo ADMINISTRADOR; el backend también lo valida).
 * Permite listar, buscar, registrar, editar (con cambio opcional de contraseña) y activar o inactivar usuarios.
 */
@Component({
  selector: 'app-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit {
  private readonly api = inject(UsuarioService);
  readonly usuarioActual = inject(AuthService).obtenerUsuarioId();
  readonly porPagina = 10;

  usuarios: UsuarioSistema[] = [];
  perfiles: Perfil[] = [];
  formulario: UsuarioRq | null = null;
  confirmarClave = '';
  porCambiarEstado: UsuarioSistema | null = null;

  busqueda = '';
  filtroPerfil: number | '' = '';
  filtroEstado: '' | 'activo' | 'inactivo' = '';
  pagina = 1;

  cargando = false;
  guardando = false;
  error = '';
  errorFormulario = '';
  aviso = '';

  ngOnInit(): void {
    this.cargar();
  }

  get filtrados(): UsuarioSistema[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.usuarios.filter(u =>
      (!q || [u.username, u.email, u.perfil, String(u.id)].some(v => v?.toLowerCase().includes(q)))
      && (this.filtroPerfil === '' || u.rol === Number(this.filtroPerfil))
      && (this.filtroEstado === '' || (this.filtroEstado === 'activo') === u.activo));
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filtrados.length / this.porPagina));
  }

  get visibles(): UsuarioSistema[] {
    return this.filtrados.slice((this.pagina - 1) * this.porPagina, this.pagina * this.porPagina);
  }

  get activos(): number {
    return this.usuarios.filter(u => u.activo).length;
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({ usuarios: this.api.listar(), perfiles: this.api.perfiles() })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: datos => {
          this.usuarios = datos.usuarios;
          this.perfiles = datos.perfiles.filter(p => p.activo);
          this.pagina = Math.min(this.pagina, this.totalPaginas);
        },
        error: e => (this.error = e.error?.mensaje ?? 'No fue posible cargar los usuarios.')
      });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroPerfil = '';
    this.filtroEstado = '';
    this.pagina = 1;
  }

  nuevo(): void {
    this.aviso = '';
    this.errorFormulario = '';
    this.confirmarClave = '';
    this.formulario = { username: '', password: '', rol: null, email: '', activo: true };
  }

  editar(u: UsuarioSistema): void {
    this.aviso = '';
    this.errorFormulario = '';
    this.confirmarClave = '';
    this.formulario = { id: u.id, username: u.username, password: '', rol: u.rol, email: u.email, activo: u.activo };
  }

  guardar(): void {
    const f = this.formulario;
    if (!f) return;
    this.errorFormulario = this.validar(f);
    if (this.errorFormulario) return;
    const datos: UsuarioRq = { ...f, username: f.username.trim(), email: f.email.trim(), password: f.password || undefined };
    this.guardando = true;
    (f.id ? this.api.actualizar(datos) : this.api.crear(datos))
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.aviso = f.id ? 'Usuario actualizado.' : 'Usuario creado.';
          this.formulario = null;
          this.cargar();
        },
        error: e => (this.errorFormulario = e.error?.mensaje ?? 'No fue posible guardar el usuario.')
      });
  }

  cambiarEstado(): void {
    const u = this.porCambiarEstado;
    if (!u) return;
    this.guardando = true;
    this.api.actualizar({ id: u.id, username: u.username, rol: u.rol, email: u.email, activo: !u.activo })
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.aviso = u.activo ? 'Usuario inactivado; sus sesiones abiertas se cerraron.' : 'Usuario activado.';
          this.porCambiarEstado = null;
          this.cargar();
        },
        error: e => {
          this.porCambiarEstado = null;
          this.error = e.error?.mensaje ?? 'No fue posible cambiar el estado.';
        }
      });
  }

  claseperfil(perfil: string): string {
    const p = perfil.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
    if (p.startsWith('ADMIN')) return 'text-bg-primary';
    if (p.startsWith('MEDICO')) return 'text-bg-success';
    if (p.startsWith('DESPACHO')) return 'text-bg-warning';
    return 'text-bg-info';
  }

  private validar(f: UsuarioRq): string {
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(f.username.trim())) {
      return 'El usuario debe tener entre 3 y 50 caracteres (letras, números, punto, guion o guion bajo).';
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'El correo electrónico no es válido.';
    if (!f.rol) return 'Selecciona el perfil del usuario.';
    const clave = f.password ?? '';
    if (!f.id || clave) {
      if (clave.length < 8 || !/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
        return 'La contraseña debe tener al menos 8 caracteres, con letras y números.';
      }
      if (clave !== this.confirmarClave) return 'Las contraseñas no coinciden.';
    }
    if (f.id === this.usuarioActual && !f.activo) return 'No puedes inactivar tu propio usuario.';
    return '';
  }
}
