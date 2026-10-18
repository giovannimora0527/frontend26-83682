import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';

import { Usuario } from 'src/app/models/usuario';
import { UsuarioRequest, UsuarioService } from './service/usuario.service';

@Component({
  selector: 'app-usuario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent {
  // Variables para el modal.
  modalInstance: Modal | null = null;
  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  // Variables para la paginación y búsqueda en la datatable.
  listUsuarios: Usuario[] = [];
  cargandoUsuarios = false;
  errorUsuarios = '';
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  readonly rolesSugeridos = ['ADMIN', 'VETERINARIO', 'RECEPCIONISTA', 'CLIENTE'];

  // Formulario para crear o editar usuario.
  form!: FormGroup;
  usuarioSelected: Usuario | null = null;
  enviando = false;
  respuestaError = '';

  constructor(private readonly usuarioService: UsuarioService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormulario();
    this.listar();
  }

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  /**
   * Filtra la lista de usuarios según el término de búsqueda ingresado por el usuario.
   * @returns Un arreglo de usuarios filtrados.
   */
  get usuariosFiltrados(): Usuario[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listUsuarios;
    }
    return this.listUsuarios.filter((usuario) =>
      [usuario.username, usuario.email, usuario.rol].some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino))
    );
  }

  get usuariosPaginados(): Usuario[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  /**
   * Metodo que lista los usuarios registrados (GET /usuario/listar).
   */
  listar() {
    this.cargandoUsuarios = true;
    this.errorUsuarios = '';
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.listUsuarios = Array.isArray(data) ? data : [];
        this.paginaActual = 1;
        this.cargandoUsuarios = false;
      },
      error: (error) => {
        console.error('Error al obtener los usuarios:', error);
        this.cargandoUsuarios = false;
        this.errorUsuarios = error.error?.message ?? 'No fue posible cargar los usuarios.';
      }
    });
  }

  // Metodo que actualiza el termino de busqueda y reinicia la pagina actual a 1.
  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  // Cambia paginacion.
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      username: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      rol: ['', [Validators.required, Validators.maxLength(30)]],
      password: [''],
      activo: [true]
    });
  }

  // Abre el modal para crear un usuario; la contraseña es obligatoria.
  nuevoUsuario() {
    this.usuarioSelected = null;
    this.resetFormulario();
    this.form.patchValue({ activo: true });
    this.f['password'].setValidators([Validators.required]);
    this.f['password'].updateValueAndValidity();
    this.openModal('C');
  }

  // Abre el modal para editar; sin contraseña nueva se conserva la actual.
  abrirEdicion(usuario: Usuario) {
    this.usuarioSelected = usuario;
    this.resetFormulario();
    this.form.patchValue({
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo ?? true
    });
    this.f['password'].clearValidators();
    this.f['password'].updateValueAndValidity();
    this.openModal('E');
  }

  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }

  guardarUsuario() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const usuario: UsuarioRequest = {
      id: this.usuarioSelected?.id,
      username: String(valores.username).trim(),
      email: String(valores.email).trim(),
      rol: String(valores.rol).trim().toUpperCase(),
      activo: Boolean(valores.activo)
    };
    if (valores.password) {
      usuario.password = valores.password;
    }

    this.enviando = true;
    this.respuestaError = '';
    const solicitud = this.modoFormulario === 'C'
      ? this.usuarioService.guardarUsuario(usuario)
      : this.usuarioService.actualizarUsuario(usuario);

    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.closeModal();
        this.listar();
        Swal.fire('Operación exitosa', respuesta?.message ?? 'Usuario guardado correctamente.', 'success');
      },
      error: (error) => {
        this.enviando = false;
        console.error('Error al guardar el usuario:', error);
        const mensaje = error.error?.message ?? error.message;
        this.respuestaError = mensaje;
        Swal.fire('Error al guardar', mensaje, 'error');
      }
    });
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  openModal(modo: string) {
    this.modoFormulario = modo;
    this.titleModal = modo === 'C' ? 'Crear Usuario' : 'Editar Usuario';
    this.titleBoton = modo === 'C' ? 'Guardar Usuario' : 'Actualizar Usuario';
    const modalElement = document.getElementById('modalCrearUsuario');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  // Metodo privado para normalizar el texto, eliminando acentos y convirtiendo a minúsculas.
  private normalizarTexto(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }
}
