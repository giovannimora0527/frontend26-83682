import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';

import { MascotaService } from './service/mascota.service';
import { RazaService } from '../raza/service/raza.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { Mascota } from 'src/app/models/mascota';
import { MascotaRq } from 'src/app/models/mascota-rq';
import { Raza } from 'src/app/models/raza';
import { Cliente } from 'src/app/models/cliente';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
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
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 10;

  // Formulario para crear o editar mascota.
  form!: FormGroup;
  mascotaSelected: Mascota | null = null;

  // Catalogos para los selects del formulario.
  listRazas: Raza[] = [];
  listClientes: Cliente[] = [];

  constructor(private readonly mascotaService: MascotaService,
    private readonly razaService: RazaService,
    private readonly clienteService: ClienteService,
    private readonly formBuilder: FormBuilder) {
    this.listar();
    this.cargarCatalogos();
    this.inicializarFormulario();
  }

  // Metodo ue permite inicializar el formulario con sus controles y validaciones.
  inicializarFormulario() {
    this.form = this.formBuilder.group({
      nombreMascota: ['', Validators.required],
      razaId: [null, Validators.required],
      edad: [null, [Validators.required, Validators.min(1)]],
      clienteId: [null, Validators.required]
    });
  }

  // Carga las razas y clientes que alimentan los selects del formulario.
  cargarCatalogos() {
    this.razaService.listarRazas().subscribe({
      next: (data) => this.listRazas = data,
      error: (error) => console.error('Error al obtener las razas:', error)
    });
    this.clienteService.listarClientes().subscribe({
      next: (data) => this.listClientes = data,
      error: (error) => console.error('Error al obtener los clientes:', error)
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
    this.mascotaService.listarMascotas()
      .subscribe(
        {
          next: (data) => {
            console.log(data);
            this.listMascotas = data;
            this.paginaActual = 1;
          },
          error: (error) => {
            console.error('Error al obtener las mascotas:', error);
          }
        }
      );
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
    this.openModal(this.modoFormulario);
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

  /**
   * Guarda o actualiza la mascota segun el modo del formulario (C = crear, E = editar).
   */
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rq: MascotaRq = {
      nombreMascota: this.form.value.nombreMascota,
      edad: Number(this.form.value.edad),
      razaId: Number(this.form.value.razaId),
      clienteId: Number(this.form.value.clienteId)
    };

    const esEdicion = this.modoFormulario === 'E' && this.mascotaSelected !== null;
    if (esEdicion) {
      rq.mascotaId = this.mascotaSelected!.mascotaId;
    }

    const peticion = esEdicion
      ? this.mascotaService.actualizarMascota(rq)
      : this.mascotaService.guardarMascota(rq);

    peticion.subscribe({
      next: (respuesta) => {
        Swal.fire('Exito', respuesta.message ?? 'Operacion exitosa', 'success');
        this.closeModal();
        this.listar();
      },
      error: (error) => {
        // El backend devuelve {status, error, message} en los errores controlados.
        const mensaje = error?.error?.message ?? 'No fue posible completar la operacion';
        Swal.fire('Error', mensaje, 'error');
      }
    });
  }
}
