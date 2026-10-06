import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';

import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import { Medico } from 'src/app/models/medico';
import { FormBuilder } from '@angular/forms';
import { MedicoService } from './service/medico.service';

@Component({
  selector: 'app-medico',
  imports: [CommonModule],
  templateUrl: './medico.component.html',
  styleUrl: './medico.component.scss'
})
export class MedicoComponent {
  // Variables para el modal.
  modalInstance: Modal | null = null;
  titleModal: string = "";
  modoFormulario: string = "";
  titleBoton: string = "";

  // Variables para la paginación y búsqueda en la datatable.
  listMedicos: Medico[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  constructor(private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder) {
    this.listar();
  }

  /**
     * Filtra la lista de médicos según el término de búsqueda ingresado por el usuario.
     * @returns Un arreglo de médicos filtrados.
     */
  get medicoFiltrados(): Medico[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listMedicos;
    }

    return this.listMedicos.filter((medico) => {
      const valores = [
        medico.nombres,
        medico.apellidos,
        medico.tipoDocumento,
        medico.numeroDocumento,
        medico.especializacion.nombre,
        medico.registroProfesional,
        medico.telefono
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });
  }

  get medicoPaginados(): Medico[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.medicoFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.medicoFiltrados.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  /**
   * Metodo que permite listar los medicos registradas en la base de datos y mostrarlas en la tabla.
   */
  listar() {
    this.medicoService.listar()
      .subscribe(
        {
          next: (data) => {
            console.log(data);
            this.listMedicos = data;
            this.paginaActual = 1;
          },
          error: (error) => {
            console.error('Error al obtener los médicos:', error);
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

  // Evento para abrir el modal de crear o editar medicos, dependiendo del modo recibido.
  nuevoMedico(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Médico' : 'Editar Médico';
    this.modoFormulario = modo;
    this.openModal(modo);
  }

  abrirEdicion(medico: Medico) {
    this.modoFormulario = 'E';
    this.openModal(this.modoFormulario);
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Médico' : 'Editar Médico';
    this.titleBoton = modo === 'C' ? 'Guardar Médico' : 'Actualizar Médico';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearMedico');
    if (modalElement) {
      // Verificar si ya existe una instancia del modal
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

}
