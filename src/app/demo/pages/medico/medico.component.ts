import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';
import { Medico } from 'src/app/models/medico';
import { Especializacion } from 'src/app/models/especializacion';
import { MedicoRequest, MedicoService } from './service/medico.service';

type ColumnaOrden = 'nombres' | 'apellidos' | 'especializacion' | 'registroProfesional' | 'tipoDocumento' | 'numeroDocumento';

@Component({
  selector: 'app-medico',
  imports: [CommonModule, ReactiveFormsModule],
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
  columnaOrden: ColumnaOrden = 'nombres';
  direccionOrden: 'asc' | 'desc' = 'asc';

  // Formulario para crear o editar médicos (columnas de la tabla medico).
  tiposDocumento = [
    { valor: 'CC', etiqueta: 'Cédula de ciudadanía (CC)' },
    { valor: 'CE', etiqueta: 'Cédula de extranjería (CE)' },
    { valor: 'PA', etiqueta: 'Pasaporte (PA)' },
    { valor: 'PEP', etiqueta: 'Permiso especial de permanencia (PEP)' }
  ];
  listEspecializaciones: Especializacion[] = [];
  form!: FormGroup;
  medicoSelected: Medico | null = null;
  enviando = false;
  respuestaError = '';

  constructor(private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormulario();
    this.listar();
    this.listarEspecializaciones();
  }

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  /**
     * Filtra la lista de médicos según el término de búsqueda ingresado por el usuario.
     * @returns Un arreglo de médicos filtrados.
     */
  get medicoFiltrados(): Medico[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtrados = this.listMedicos.filter((medico) => {
      if (!termino) {
        return true;
      }

      const valores = [
        medico.nombres,
        medico.apellidos,
        medico.tipoDocumento,
        medico.numeroDocumento,
        medico.especializacion?.nombre,
        medico.registroProfesional,
        medico.telefono
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return [...filtrados].sort((medicoA, medicoB) => {
      const comparacion = this.obtenerValorOrden(medicoA, this.columnaOrden)
        .localeCompare(this.obtenerValorOrden(medicoB, this.columnaOrden), 'es', { numeric: true, sensitivity: 'base' });

      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  private obtenerValorOrden(medico: Medico, columna: ColumnaOrden): string {
    switch (columna) {
      case 'nombres':
        return medico.nombres ?? '';
      case 'apellidos':
        return medico.apellidos ?? '';
      case 'especializacion':
        return medico.especializacion?.nombre ?? '';
      case 'registroProfesional':
        return medico.registroProfesional ?? '';
      case 'tipoDocumento':
        return medico.tipoDocumento ?? '';
      case 'numeroDocumento':
        return medico.numeroDocumento ?? '';
    }
  }

  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.paginaActual = 1;
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
            this.listMedicos = data;
            this.paginaActual = 1;
          },
          error: (error) => {
            console.error('Error al obtener los médicos:', error);
          }
        }
      );
  }

  // Carga las especializaciones existentes para el selector del formulario.
  listarEspecializaciones() {
    this.medicoService.listarEspecializaciones().subscribe({
      next: (data) => this.listEspecializaciones = data,
      error: (error) => console.error('Error al obtener las especializaciones:', error)
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
      .replace(/[̀-ͯ]/g, '');
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      tipoDocumento: ['CC', [Validators.required, Validators.maxLength(10)]],
      numeroDocumento: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20), Validators.pattern(/^[0-9+()\- ]{7,20}$/)]],
      registroProfesional: ['', [Validators.required, Validators.maxLength(50)]],
      especializacionId: [null, Validators.required]
    });
  }

  // Evento para abrir el modal de crear o editar medicos, dependiendo del modo recibido.
  nuevoMedico(modo: string) {
    this.medicoSelected = null;
    this.resetFormulario();
    this.form.patchValue({ tipoDocumento: 'CC' });
    this.openModal(modo);
  }

  // Abre el modal de edición con los datos del médico seleccionado.
  abrirEdicion(medico: Medico) {
    this.medicoSelected = medico;
    this.resetFormulario();
    // Conserva tipos de documento existentes en la base aunque no estén en la lista sugerida.
    if (medico.tipoDocumento && !this.tiposDocumento.some((t) => t.valor === medico.tipoDocumento)) {
      this.tiposDocumento = [...this.tiposDocumento, { valor: medico.tipoDocumento, etiqueta: medico.tipoDocumento }];
    }
    this.form.patchValue({
      tipoDocumento: medico.tipoDocumento,
      numeroDocumento: medico.numeroDocumento,
      nombres: medico.nombres,
      apellidos: medico.apellidos,
      telefono: medico.telefono ?? '',
      registroProfesional: medico.registroProfesional,
      especializacionId: medico.especializacion?.id ?? null
    });
    this.openModal('E');
  }

  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }

  guardarMedico() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const medico: MedicoRequest = {
      tipoDocumento: String(v.tipoDocumento).trim(),
      numeroDocumento: String(v.numeroDocumento).trim(),
      nombres: String(v.nombres).trim(),
      apellidos: String(v.apellidos).trim(),
      telefono: v.telefono ? String(v.telefono).trim() : null,
      registroProfesional: String(v.registroProfesional).trim(),
      especializacionId: Number(v.especializacionId)
    };
    const id = this.medicoSelected?.veterinarioId ?? this.medicoSelected?.id;
    if (this.modoFormulario === 'E' && id == null) {
      this.respuestaError = 'El médico seleccionado no tiene un identificador válido.';
      return;
    }

    this.enviando = true;
    this.respuestaError = '';
    const solicitud = this.modoFormulario === 'C'
      ? this.medicoService.crear(medico)
      : this.medicoService.actualizar(id as number, medico);

    solicitud.subscribe({
      next: () => {
        this.enviando = false;
        this.closeModal();
        this.listar();
        Swal.fire('Operación exitosa',
          this.modoFormulario === 'C' ? 'El médico fue creado correctamente.' : 'El médico fue actualizado correctamente.',
          'success');
      },
      error: (error) => {
        this.enviando = false;
        console.error('Error al guardar el médico:', error);
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
