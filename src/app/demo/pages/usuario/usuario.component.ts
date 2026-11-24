import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../login/service/auth.service';
import { Perfil } from 'src/app/models/perfil';
import { Usuario, UsuarioRq } from 'src/app/models/usuario';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { codigoRol, nombreRol } from 'src/app/shared/estados-ui';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { normalizarTexto, Tabla } from 'src/app/shared/utils/tabla.util';
import { UsuarioService } from './service/usuario.service';

const CLAVE_SEGURA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

/** BCrypt admite 72 bytes; las tildes y otros símbolos ocupan más de uno. */
function maximoBytes(control: AbstractControl<string>): ValidationErrors | null {
  return new TextEncoder().encode(control.value).length > 72 ? { maximoBytes: true } : null;
}

function clavesIguales(grupo: AbstractControl): ValidationErrors | null {
  return grupo.get('password')?.value === grupo.get('confirmacion')?.value ? null : { clavesDistintas: true };
}

@Component({
  selector: 'app-usuario',
  imports: [FormsModule, ReactiveFormsModule, BotonOrdenComponent, PaginacionComponent, FechaHoraPipe],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly usuarioService = inject(UsuarioService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly usuarioActualId = Number(inject(AuthService).obtenerUsuario()?.sub);
  private modal?: NgbModalRef;

  readonly esInvalido = esInvalido;
  readonly nombreRol = nombreRol;
  readonly columnas = [
    { clave: 'username', titulo: 'Usuario' },
    { clave: 'email', titulo: 'Correo' },
    { clave: 'rol', titulo: 'Perfil' },
    { clave: 'fecha', titulo: 'Creación' },
    { clave: 'estado', titulo: 'Estado' }
  ];
  readonly tabla = new Tabla<Usuario>(
    {
      username: (usuario) => usuario.username,
      email: (usuario) => usuario.email,
      rol: (usuario) => nombreRol(usuario.rol),
      fecha: (usuario) => usuario.fechaCreacion,
      estado: (usuario) => (usuario.activo ? 'Activo' : 'Inactivo')
    },
    'username'
  );
  readonly form = this.formBuilder.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.pattern(/^\s*\S+\s*$/), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      perfilId: this.formBuilder.control<number | null>(null, Validators.required),
      password: [''],
      confirmacion: ['']
    },
    { validators: clavesIguales }
  );

  perfiles: Perfil[] = [];
  cargandoPerfiles = false;
  errorPerfiles = '';
  cargando = false;
  errorListado = '';
  usuarioSelected: Usuario | null = null;
  modoFormulario: 'C' | 'E' = 'C';
  enviando = false;
  respuestaError = '';
  cambiandoEstadoId: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.listar();
    this.listarPerfiles();
  }

  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    this.usuarioService.listarUsuarios().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (usuarios) => this.tabla.items = usuarios,
      error: (error) => this.errorListado = mensajeError(error, 'No fue posible cargar los usuarios.')
    });
  }

  listarPerfiles(): void {
    this.cargandoPerfiles = true;
    this.errorPerfiles = '';
    this.usuarioService.listarPerfiles().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoPerfiles = false)
    ).subscribe({
      next: (perfiles) => {
        this.perfiles = perfiles;
        this.seleccionarPerfilActual();
      },
      error: (error) => this.errorPerfiles = mensajeError(error, 'No fue posible cargar los perfiles.')
    });
  }

  get esPerfilMedico(): boolean {
    const perfil = this.perfiles.find(({ id }) => id === this.form.controls.perfilId.value);
    return codigoRol(perfil?.codigo ?? perfil?.nombre) === 'MEDICO';
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return usuario.id === this.usuarioActualId;
  }

  nuevoUsuario(contenido: TemplateRef<unknown>): void {
    this.modoFormulario = 'C';
    this.usuarioSelected = null;
    this.form.reset();
    this.abrir(contenido);
  }

  abrirEdicion(usuario: Usuario, contenido: TemplateRef<unknown>): void {
    this.modoFormulario = 'E';
    this.usuarioSelected = usuario;
    this.form.reset({ username: usuario.username, email: usuario.email });
    this.seleccionarPerfilActual();
    this.abrir(contenido);
  }

  guardarUsuario(): void {
    if (this.enviando) {
      return;
    }
    const valores = this.form.getRawValue();
    if (this.form.invalid || valores.perfilId === null) {
      this.form.markAllAsTouched();
      return;
    }
    const datos: UsuarioRq = { username: valores.username.trim(), email: valores.email.trim(), perfilId: valores.perfilId };
    if (valores.password) {
      datos.password = valores.password;
    }
    const id = this.usuarioSelected?.id;
    const solicitud: Observable<unknown> = id === undefined
      ? this.usuarioService.crearUsuario(datos)
      : this.usuarioService.actualizarUsuario({ ...datos, id });
    this.enviando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: () => {
        this.enviando = false;
        this.modal?.close();
        this.listar();
        void Swal.fire('Operación exitosa', id === undefined
          ? 'El usuario fue creado correctamente.' : 'El usuario fue actualizado correctamente.', 'success');
      },
      error: (error: unknown) => this.mostrarError(error)
    });
  }

  async cambiarEstado(usuario: Usuario): Promise<void> {
    if (this.cambiandoEstadoId !== null || this.esUsuarioActual(usuario)) {
      return;
    }
    const activo = !usuario.activo;
    this.cambiandoEstadoId = usuario.id;
    const { isConfirmed } = await Swal.fire({
      title: activo ? '¿Activar usuario?' : '¿Inactivar usuario?',
      text: activo
        ? `${usuario.username} podrá volver a iniciar sesión.`
        : `${usuario.username} no podrá iniciar sesión y se rechazará su sesión actual.`,
      icon: 'warning', showCancelButton: true, confirmButtonText: activo ? 'Activar' : 'Inactivar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.cambiandoEstadoId = null;
      return;
    }
    this.usuarioService.cambiarEstado(usuario.id, activo).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cambiandoEstadoId = null)
    ).subscribe({
      next: () => this.listar(),
      error: (error) => void Swal.fire('No se pudo cambiar el estado', mensajeError(error, 'Intenta nuevamente.'), 'error')
    });
  }

  private seleccionarPerfilActual(): void {
    if (this.modoFormulario !== 'E' || !this.usuarioSelected || this.form.controls.perfilId.value !== null) {
      return;
    }
    const { rol } = this.usuarioSelected;
    const codigo = codigoRol(rol);
    const perfil = this.perfiles.find((opcion) => opcion.codigo === rol || opcion.nombre === rol || (codigo !== null && opcion.codigo === codigo));
    this.form.controls.perfilId.setValue(perfil?.id ?? null);
  }

  private abrir(contenido: TemplateRef<unknown>): void {
    const { password } = this.form.controls;
    password.setValidators([
      ...(this.modoFormulario === 'C' ? [Validators.required] : []), Validators.pattern(CLAVE_SEGURA), maximoBytes
    ]);
    password.updateValueAndValidity();
    this.respuestaError = '';
    if (this.errorPerfiles) {
      this.listarPerfiles();
    }
    this.modal = this.modalService.open(contenido, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'usuarioTitulo'
    });
  }

  private mostrarError(error: unknown): void {
    if (marcarErroresServidor(this.form, error)) {
      return;
    }
    const mensaje = mensajeError(error, 'No fue posible guardar el usuario.');
    // El 409 no trae el campo: se distingue por el texto ("nombre de usuario" o "correo").
    if (error instanceof HttpErrorResponse && error.status === 409) {
      const texto = normalizarTexto(mensaje);
      const control = texto.includes('correo') ? this.form.controls.email
        : texto.includes('usuario') ? this.form.controls.username : null;
      if (control) {
        control.setErrors({ servidor: mensaje });
        control.markAsTouched();
        return;
      }
    }
    this.respuestaError = mensaje;
  }
}
