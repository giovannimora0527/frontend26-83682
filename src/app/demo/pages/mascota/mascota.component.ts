import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { MascotaService } from './service/mascota.service';
import { Mascota } from 'src/app/models/mascota';
import { Raza } from 'src/app/models/raza';
import { ClienteService } from '../cliente/service/cliente.service';
import { RazaService } from '../raza/service/raza.service';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { getApiErrorMessage } from 'src/app/services/backend.service';

import { Modal } from 'bootstrap';

@Component({
  selector: 'app-mascota',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent {
  // Variables para el modal.
  modalInstance: Modal | null = null;
  titleModal: string = "";
  modoFormulario: string = "";
  titleBoton: string = "";

  // Variables para la paginación y búsqueda en la datatable.
  listMascotas: Mascota[] = [];
  clientesDisponibles: Cliente[] = [];
  razasDisponibles: Raza[] = [];
  cargando = true;
  cargandoCatalogos = false;
  guardando = false;
  eliminandoId: number | null = null;
  error = '';
  errorFormulario = '';
  catalogosError = '';
  mensaje = '';
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 10;

  // Formulario para crear o editar mascota.
  form!: FormGroup;
  mascotaSelected: Mascota | null = null;

  constructor(
    private readonly mascotaService: MascotaService,
    private readonly clienteService: ClienteService,
    private readonly razaService: RazaService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
    this.cargarCatalogos();
  }

  // Metodo ue permite inicializar el formulario con sus controles y validaciones.
  inicializarFormulario() {
    this.form = this.formBuilder.group({
      nombreMascota: ['', Validators.required],
      razaId: [null, Validators.required],
      edad: [null, [Validators.required, Validators.min(0)]],
      clienteId: [null, Validators.required]
    });
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Filtra la lista de mascotas según el término de búsqueda ingresado por el usuario.
   * @returns Un arreglo de mascotas filtradas.
   */
  get mascotasFiltradas(): Mascota[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listMascotas;
    }

    return this.listMascotas.filter((mascota) => {
      const valores = [
        mascota.nombreMascota,
        mascota.raza?.especie,
        mascota.raza?.nombre,
        mascota.edad,
        `${mascota.cliente?.nombres ?? ''} ${mascota.cliente?.apellidos ?? ''}`,
        mascota.fechaRegistro
          ? formatDate(mascota.fechaRegistro, 'yyyy-MM-dd HH:mm', 'en-US')
          : ''
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });
  }

  get mascotasPaginadas(): Mascota[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.mascotasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.mascotasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  /**
   * Metodo que permite listar las mascotas registradas en la base de datos y mostrarlas en la tabla.
   */
  listar() {
    this.cargando = true;
    this.error = '';
    this.mascotaService.listarMascotas().subscribe({
      next: (data) => {
        this.listMascotas = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: unknown) => {
        console.error('Error al obtener las mascotas:', error);
        this.error = 'No fue posible cargar las mascotas.';
        this.cargando = false;
      }
    });
  }

  /**
   * Carga los clientes y razas que se necesitan para relacionar una mascota.
   */
  cargarCatalogos(): void {
    this.cargandoCatalogos = true;
    this.catalogosError = '';

    forkJoin({
      clientes: this.clienteService.listarClientes(),
      razas: this.razaService.listarRazas()
    }).subscribe({
      next: ({ clientes, razas }) => {
        this.clientesDisponibles = clientes;
        this.razasDisponibles = razas;
        this.cargandoCatalogos = false;
      },
      error: (error: unknown) => {
        console.error('Error al obtener clientes y razas para mascotas:', error);
        this.catalogosError = 'No fue posible cargar los clientes y las razas.';
        this.cargandoCatalogos = false;
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

  // Metodo privado para normalizar el texto, eliminando acentos y convirtiendo a minúsculas.
  private normalizarTexto(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Evento para abrir el modal de crear o editar mascota, dependiendo del modo recibido.
  nuevaMascota(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Mascota' : 'Editar Mascota';
    this.modoFormulario = modo;
    this.mascotaSelected = null;
    this.mensaje = '';
    this.error = '';
    this.errorFormulario = '';
    this.resetFormulario();
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  abrirEdicion(mascota: Mascota) {
    this.mascotaSelected = mascota;
    this.modoFormulario = 'E';
    this.form.patchValue({
      nombreMascota: mascota.nombreMascota,
      razaId: mascota.raza?.razaId ?? null,
      edad: mascota.edad,
      clienteId: mascota.cliente?.clienteId ?? null
    });
    this.error = '';
    this.errorFormulario = '';
    this.mensaje = '';
    this.openModal(this.modoFormulario);
  }

  /**
   * Guarda una mascota nueva o actualiza la seleccionada usando la API.
   */
  guardarMascota(): void {
    if (this.form.invalid || this.guardando || this.cargandoCatalogos) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const raza = this.razasDisponibles.find((item) => item.razaId === Number(valores.razaId));
    const cliente = this.clientesDisponibles.find((item) => item.clienteId === Number(valores.clienteId));

    if (!raza || !cliente) {
      this.errorFormulario = 'Selecciona un cliente y una raza válidos.';
      return;
    }

    const mascota: Mascota = {
      nombreMascota: String(valores.nombreMascota).trim(),
      edad: Number(valores.edad),
      raza,
      cliente,
      ...(this.mascotaSelected?.fechaRegistro === undefined
        ? {}
        : { fechaRegistro: this.mascotaSelected.fechaRegistro }),
      ...(this.mascotaSelected?.fechaModificacion === undefined
        ? {}
        : { fechaModificacion: this.mascotaSelected.fechaModificacion }),
      ...(this.mascotaSelected?.mascotaId === undefined
        ? {}
        : { mascotaId: this.mascotaSelected.mascotaId })
    };
    const esEdicion = this.mascotaSelected !== null;
    const solicitud = esEdicion
      ? this.mascotaService.actualizarMascota(mascota)
      : this.mascotaService.guardarMascota(mascota);

    this.guardando = true;
    this.errorFormulario = '';
    this.mensaje = '';
    solicitud.subscribe({
      next: () => {
        this.mensaje = esEdicion
          ? 'La mascota se actualizó correctamente.'
          : 'La mascota se registró correctamente.';
        this.closeModal();
        this.listar();
      },
      error: (error: unknown) => {
        console.error('Error al guardar la mascota:', error);
        this.errorFormulario = 'No fue posible guardar la mascota. Verifica los datos e inténtalo de nuevo.';
        this.guardando = false;
      },
      complete: () => {
        this.guardando = false;
      }
    });
  }

  eliminarMascota(mascota: Mascota): void {
    if (mascota.mascotaId === undefined || this.eliminandoId !== null) {
      return;
    }
    if (!window.confirm(`¿Eliminar a ${mascota.nombreMascota}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.eliminandoId = mascota.mascotaId;
    this.error = '';
    this.mensaje = '';
    this.mascotaService.eliminarMascota(mascota.mascotaId).subscribe({
      next: () => {
        this.mensaje = 'La mascota se eliminó correctamente.';
        this.listar();
      },
      error: (error: unknown) => {
        console.error('Error al eliminar la mascota:', error);
        this.error = getApiErrorMessage(error, 'No fue posible eliminar la mascota.');
        this.eliminandoId = null;
      },
      complete: () => {
        this.eliminandoId = null;
      }
    });
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.resetFormulario();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Mascota' : 'Editar Mascota';
    this.titleBoton = modo === 'C' ? 'Guardar Mascota' : 'Actualizar Mascota';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearMascota');
    if (modalElement) {
      // Verificar si ya existe una instancia del modal
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }


}
