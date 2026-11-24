import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, merge, Subscription } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { NgbModal, NgbModalRef, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import Swal from 'sweetalert2';
import { Cita, CitaRq, ServicioCita } from 'src/app/models/cita';
import { CitaService } from './service/cita.service';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { ServicioService } from '../tarifas/service/servicio.service';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { DURACION_SIN_SERVICIO, duracionCita, esEditable, estadoCita } from './cita.util';
import { HistorialCitaComponent } from './historial-cita/historial-cita.component';

type ColumnaOrden = 'mascota' | 'medico' | 'fechaHora' | 'motivo' | 'estado';
type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };



@Component({
  selector: 'app-cita',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule, BadgeEstadoComponent],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent {

  // Variables para el modal.
  modalInstance: ModalBootstrap | null = null;
  modalDetalleInstance: ModalBootstrap | null = null;
  citaDetalle: Cita | null = null;
  titleModal: string = "";
  modoFormulario: string = "";
  titleBoton: string = "";


  // Variables para la paginación, ordenamiento y búsqueda en la datatable.
  listCitas: Cita[] = [];
  listMascotas: Mascota[] = [];
  listMedicos: Medico[] = [];
  cargandoMascotas = false;
  cargandoMedicos = false;
  errorMascotas = '';
  errorMedicos = '';
  errorCitas = '';
  disponibilidadConsultada = false;
  private consultaMedicos?: Subscription;
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private modalHistorial?: NgbModalRef;
  listServicios: ServicioCita[] = [];
  errorServicios = '';
  readonly duracionCita = duracionCita;
  readonly esEditable = esEditable;
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'mascota';
  direccionOrden: 'asc' | 'desc' = 'asc';

  // Formulario para crear o editar cita.
  form!: FormGroup;
  citaSelected: Cita | null = null;
  enviando = false;
  respuestaError = '';

  constructor(private readonly citaService: CitaService,    
    private readonly formBuilder: FormBuilder,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly servicioService: ServicioService) {
    this.destroyRef.onDestroy(() => this.modalHistorial?.dismiss());
    this.inicializarFormulario();
    this.listarCitas();
    this.listarMascotas();
    this.listarServicios();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      mascota: [null, Validators.required],
      servicio: [null, Validators.required],
      medico: [null, Validators.required],
      fechaHora: [null, [
        Validators.required,
        (control: AbstractControl) => control.value && Number.isNaN(new Date(control.value).getTime())
          ? { fechaInvalida: true } : null
      ]],
      motivo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],
      estado: ['', Validators.required],
      motivoCancelacion: ['', Validators.maxLength(255)]
    });
    // La disponibilidad depende de la hora de inicio y de la duración del servicio.
    merge(this.form.controls['fechaHora'].valueChanges, this.form.controls['servicio'].valueChanges).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.consultaMedicos?.unsubscribe();
      this.cargandoMedicos = false;
      this.disponibilidadConsultada = false;
      this.errorMedicos = '';
      this.listMedicos = [];
      this.form.controls['medico'].reset();
    });
  }

  listarCitas() {
    this.errorCitas = '';
    this.citaService.listarCitas().subscribe({
      next: (citas) => {
        this.listCitas = citas;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.errorCitas = 'No fue posible cargar las citas.';
        console.error('Error al listar citas:', err);
      }
    });
  }

  listarMascotas(): void {
    this.cargandoMascotas = true;
    this.errorMascotas = '';
    this.mascotaService.listarMascotas().subscribe({
      next: (mascotas) => {
        this.listMascotas = mascotas;
        this.cargandoMascotas = false;
      },
      error: (error) => {
        this.cargandoMascotas = false;
        this.errorMascotas = 'No fue posible cargar las mascotas.';
        console.error('Error al listar mascotas:', error);
      }
    });
  }

  listarServicios(): void {
    this.errorServicios = '';
    this.servicioService.listar(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (servicios) => this.listServicios = servicios,
      error: (error) => this.errorServicios = mensajeError(error, 'No fue posible cargar los servicios.')
    });
  }

  /** Servicios activos, más el que ya tenga la cita en edición. */
  get serviciosDisponibles(): ServicioCita[] {
    const actual = this.citaSelected?.servicio;
    return actual && !this.listServicios.some(({ id }) => id === actual.id) ? [actual, ...this.listServicios] : this.listServicios;
  }

  get duracionMinutos(): number {
    return (this.form.controls['servicio'].value as ServicioCita | null)?.duracionMinutos ?? DURACION_SIN_SERVICIO;
  }

  compararServicios(servicioA: ServicioCita | null, servicioB: ServicioCita | null): boolean {
    return servicioA === servicioB || (servicioA?.id !== undefined && servicioA.id === servicioB?.id);
  }

  get fechaInicio(): Date | null {
    const control = this.form.controls['fechaHora'];
    return control.valid && control.value ? new Date(control.value) : null;
  }

  get fechaFin(): Date | null {
    const inicio = this.fechaInicio;
    return inicio ? new Date(inicio.getTime() + this.duracionMinutos * 60 * 1000) : null;
  }

  consultarMedicosDisponibles(): void {
    const inicio = this.fechaInicio;
    const fin = this.fechaFin;
    if (!inicio || !fin) {
      this.form.controls['fechaHora'].markAsTouched();
      return;
    }
    if (this.cargandoMedicos || this.enviando) {
      return;
    }
    this.listarMedicosDisponiblesPorFecha(inicio, fin);
  }

  listarMedicosDisponiblesPorFecha(fechaInicio: Date, fechaFin: Date): void {
    this.consultaMedicos?.unsubscribe();
    this.listMedicos = [];
    this.form.controls['medico'].reset();
    this.disponibilidadConsultada = false;
    this.cargandoMedicos = true;
    this.errorMedicos = '';
    this.consultaMedicos = this.medicoService
      .listarMedicosDisponiblesPorFecha(fechaInicio, fechaFin)
      .pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (medicos) => {
        // Al editar, la propia cita ocupa al médico asignado: se ofrece igual y el backend valida el cruce.
        const asignado = this.modoFormulario === 'E' ? this.citaSelected?.medico : undefined;
        this.listMedicos = asignado && !medicos.some(({ id }) => id === asignado.id) ? [...medicos, asignado] : medicos;
        this.cargandoMedicos = false;
        this.disponibilidadConsultada = true;
      },
      error: (error) => {
        this.cargandoMedicos = false;
        this.errorMedicos = 'No fue posible cargar los médicos disponibles.';
        console.error('Error al listar médicos disponibles:', error);
      }
    });
  }

  compararMascotas(mascotaA: Mascota | null, mascotaB: Mascota | null): boolean {
    return mascotaA === mascotaB ||
      (mascotaA?.mascotaId != null && mascotaA.mascotaId === mascotaB?.mascotaId);
  }

  compararMedicos(medicoA: Medico | null, medicoB: Medico | null): boolean {
    return medicoA === medicoB || (medicoA?.id != null && medicoA.id === medicoB?.id);
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Filtra la lista de citas según el término de búsqueda ingresado por el usuario.
   * @returns Un arreglo de citas filtradas.
   */
  get citasFiltradas(): Cita[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listCitas.filter((cita) => {
      if (!termino) {
        return true;
      }

      const valores = [
        this.obtenerValorOrden(cita, 'mascota'),
        this.obtenerValorOrden(cita, 'medico'),
        this.obtenerValorOrden(cita, 'fechaHora'),
        cita.motivo,
        this.obtenerValorOrden(cita, 'estado')
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return [...filtradas].sort((citaA, citaB) => {
      const valorA = this.obtenerValorOrden(citaA, this.columnaOrden);
      const valorB = this.obtenerValorOrden(citaB, this.columnaOrden);
      const comparacion = typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' });

      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  private obtenerValorOrden(cita: Cita, columna: ColumnaOrden): string | number {
    switch (columna) {
      case 'mascota':
        return cita.mascota?.nombreMascota ?? cita.mascota?.nombre ?? '';
      case 'medico':
        return  `${cita.medico?.nombres ?? ''} ${cita.medico?.apellidos ?? ''}`;
      case 'fechaHora':
        return cita.fechaInicio ? formatDate(cita.fechaInicio, 'yyyy-MM-dd HH:mm', 'en-US')
          : '';
      case 'motivo':
        return cita.motivo ?? '';
      case 'estado':
        return ESTADOS_UI[estadoCita(cita.estado)]?.etiqueta ?? cita.estado ?? '';
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

  get citasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
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

   /**
     * Metodos para la gestion de citas (crear, editar, guardar).
     */
  
    // Evento para abrir el modal de crear o editar cita, dependiendo del modo recibido.
    nuevaCita(modo: string) {
      this.titleModal = modo === 'C' ? 'Crear Cita' : 'Editar Cita';
      this.modoFormulario = modo;
      this.citaSelected = null;
      this.resetFormulario();
      this.form.controls['servicio'].setValidators(Validators.required);
      this.form.controls['servicio'].updateValueAndValidity({ emitEvent: false });
      this.form.controls['estado'].setValue('PROGRAMADA');
      this.openModal(modo);
    }  
   
  
    verCita(cita: Cita): void {
      this.citaDetalle = cita;
      const modalElement = document.getElementById('modalVerCita');
      if (modalElement) {
        this.modalDetalleInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
        this.modalDetalleInstance.show();
      }
    }

    cerrarDetalle(): void {
      this.modalDetalleInstance?.hide();
    }

    esCitaCancelada(cita: Cita | null): boolean {
      return estadoCita(cita?.estado) === 'CANCELADA';
    }

    abrirEdicion(cita: Cita) {
      if (this.esCitaCancelada(cita)) {
        Swal.fire('Cita cancelada', 'No se puede editar una cita cancelada.', 'warning');
        return;
      }
      if (!esEditable(cita.estado)) {
        Swal.fire('Cita no editable', 'Solo se editan citas programadas o confirmadas.', 'warning');
        return;
      }
      this.resetFormulario();
      this.citaSelected = cita;
      this.modoFormulario = 'E';
      // Las citas anteriores pueden no tener servicio: duran 30 minutos y lo conservan vacío.
      this.form.controls['servicio'].setValidators(cita.servicio ? Validators.required : null);
      this.form.patchValue({
        servicio: cita.servicio ?? null,
        fechaHora: cita.fechaInicio ? formatDate(cita.fechaInicio, "yyyy-MM-dd'T'HH:mm", 'en-US') : null,
        mascota: cita.mascota,
        medico: cita.medico,
        motivo: cita.motivo ?? null,
        estado: estadoCita(cita.estado)
      });
      this.listMedicos = cita.medico ? [cita.medico] : [];
      this.openModal(this.modoFormulario);
    }
  
    /** Estados a los que puede pasar la cita en edición; los de atención los asigna el módulo de atención. */
    get cambiosEstado(): { valor: string; etiqueta: string }[] {
      const cambios = estadoCita(this.citaSelected?.estado) === 'PROGRAMADA' ? ['CONFIRMADA', 'CANCELADA'] as const : ['CANCELADA'] as const;
      return cambios.map((valor) => ({ valor, etiqueta: ESTADOS_UI[valor].etiqueta }));
    }

    get estadoActual(): string {
      return estadoCita(this.citaSelected?.estado);
    }

    get cancelando(): boolean {
      return this.modoFormulario === 'E' && this.form.controls['estado'].value === 'CANCELADA';
    }

    etiquetaEstado(estado: string | null | undefined): string {
      return ESTADOS_UI[estadoCita(estado)]?.etiqueta ?? estado ?? '';
    }

    /** Crea o actualiza la cita. */
    guardarCita() {
      if (this.enviando) {
        return;
      }
      if (this.modoFormulario === 'E' && this.esCitaCancelada(this.citaSelected)) {
        this.respuestaError = 'No se puede actualizar una cita cancelada.';
        return;
      }
      if (this.cancelando) {
        void this.cancelarCita();
        return;
      }
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }

      const valores = this.form.getRawValue();
      const cita: CitaRq = {
        mascotaId: valores.mascota.mascotaId,
        medicoId: valores.medico.id,
        fechaInicio: `${valores.fechaHora}:00`,
        motivo: valores.motivo.trim()
      };
      if (valores.servicio) {
        cita.servicioId = valores.servicio.id;
      }
      if (this.modoFormulario === 'E') {
        cita.id = this.citaSelected?.id;
        if (valores.estado !== this.estadoActual) {
          cita.estado = valores.estado;
        }
      }
      this.enviar(this.modoFormulario === 'C' ? this.citaService.guardarCita(cita) : this.citaService.actualizarCita(cita));
    }

    private async cancelarCita(): Promise<void> {
      const motivo = (this.form.controls['motivoCancelacion'].value ?? '').trim();
      const id = this.citaSelected?.id;
      if (!motivo || this.form.controls['motivoCancelacion'].invalid || id === undefined) {
        this.form.controls['motivoCancelacion'].markAsTouched();
        this.respuestaError = 'Escribe el motivo de la cancelación.';
        return;
      }
      this.enviando = true;
      const { isConfirmed } = await Swal.fire({
        title: '¿Cancelar la cita?', text: 'Una cita cancelada no se puede volver a editar.', icon: 'warning',
        showCancelButton: true, confirmButtonText: 'Cancelar cita', cancelButtonText: 'Volver'
      });
      if (!isConfirmed) {
        this.enviando = false;
        return;
      }
      this.enviar(this.citaService.cambiarEstado(id, 'CANCELADA', motivo));
    }

    private enviar(solicitud: ReturnType<CitaService['guardarCita']>): void {
      this.enviando = true;
      this.respuestaError = '';
      solicitud.pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enviando = false)
      ).subscribe({
        next: ({ message }) => {
          this.enviando = false;
          this.closeModal();
          this.listarCitas();
          Swal.fire('Operación exitosa', message, 'success');
        },
        error: (error) => this.respuestaError = mensajeError(error, 'No fue posible guardar la cita.')
      });
    }

    verHistorialMascota(cita: Cita): void {
      const mascotaId = cita.mascota?.mascotaId;
      if (mascotaId === undefined) {
        return;
      }
      this.modalHistorial = this.modalService.open(HistorialCitaComponent, { size: 'lg', scrollable: true, ariaLabelledBy: 'historialTitulo' });
      this.modalHistorial.componentInstance.mascotaId = mascotaId;
      this.modalHistorial.componentInstance.titulo = `Historial de ${cita.mascota?.nombreMascota ?? cita.mascota?.nombre ?? 'la mascota'}`;
    }


  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }


  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.resetFormulario();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Cita' : 'Editar Cita';
    this.titleBoton = modo === 'C' ? 'Guardar Cita' : 'Actualizar Cita';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearCita');
    if (modalElement) {
      // Verificar si ya existe una instancia del modal
      this.modalInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

}
