import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { EspecializacionService } from '../../especializacion/service/especializacion.service';
import { Especializacion } from 'src/app/models/especializacion';
import { TipoServicio } from 'src/app/models/estados';
import { Servicio, ServicioRq } from 'src/app/models/servicio';
import { TIPOS_SERVICIO, etiquetaDe } from 'src/app/shared/catalogos';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { ServicioService } from '../service/servicio.service';

@Component({
  selector: 'app-servicios',
  imports: [FormsModule, ReactiveFormsModule, BotonOrdenComponent, PaginacionComponent, MonedaPipe],
  templateUrl: './servicios.component.html'
})
export class ServiciosComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly formBuilder = inject(FormBuilder);
  private readonly servicioService = inject(ServicioService);
  private readonly especializacionService = inject(EspecializacionService);
  private modal?: NgbModalRef;

  readonly esInvalido = esInvalido;
  readonly tipos = TIPOS_SERVICIO;
  readonly columnas = [
    { clave: 'codigo', titulo: 'Código' }, { clave: 'nombre', titulo: 'Nombre' }, { clave: 'tipo', titulo: 'Tipo' },
    { clave: 'especialidad', titulo: 'Especialidad' }, { clave: 'duracion', titulo: 'Duración' }, { clave: 'tarifa', titulo: 'Tarifa vigente' },
    { clave: 'estado', titulo: 'Estado' }
  ];
  readonly tabla = new Tabla<Servicio>(
    {
      codigo: (s) => s.codigo,
      nombre: (s) => s.nombre,
      tipo: (s) => etiquetaDe(TIPOS_SERVICIO, s.tipoServicio),
      especialidad: (s) => s.especializacionNombre,
      duracion: (s) => s.duracionMinutos,
      tarifa: (s) => s.tarifaVigente?.valor ?? -1,
      estado: (s) => (s.activo ? 'Activo' : 'Inactivo')
    },
    'nombre'
  );
  readonly form = this.formBuilder.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    descripcion: ['', Validators.maxLength(1000)],
    tipoServicio: this.formBuilder.nonNullable.control<TipoServicio | ''>('', Validators.required),
    especializacionId: this.formBuilder.control<number | null>(null),
    duracionMinutos: this.formBuilder.control<number | null>(null, [
      Validators.required, Validators.pattern(/^\d+$/), Validators.min(1), Validators.max(720)
    ])
  });

  especializaciones: Especializacion[] = [];
  errorEspecializaciones = '';
  cargando = false;
  errorListado = '';
  seleccionado: Servicio | null = null;
  enviando = false;
  respuestaError = '';
  cambiandoEstado = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.listar();
    this.especializacionService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (especializaciones) => this.especializaciones = especializaciones,
      error: (error) => this.errorEspecializaciones = mensajeError(error, 'No fue posible cargar las especialidades.')
    });
  }

  etiquetaTipo(tipo: TipoServicio): string {
    return etiquetaDe(TIPOS_SERVICIO, tipo);
  }

  /** Especialidades activas, más la que ya tiene el servicio en edición. */
  get especialidadesDisponibles(): Especializacion[] {
    return this.especializaciones.filter(({ id, activo }) => activo !== false || id === this.seleccionado?.especializacionId);
  }

  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    this.servicioService.listar().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (servicios) => this.tabla.items = servicios,
      error: (error) => this.errorListado = mensajeError(error, 'No fue posible cargar los servicios.')
    });
  }

  abrir(servicio: Servicio | null, contenido: TemplateRef<unknown>): void {
    this.seleccionado = servicio;
    this.form.reset(servicio ? {
      codigo: servicio.codigo, nombre: servicio.nombre, descripcion: servicio.descripcion ?? '', tipoServicio: servicio.tipoServicio,
      especializacionId: servicio.especializacionId, duracionMinutos: servicio.duracionMinutos
    } : {});
    this.respuestaError = '';
    this.modal = this.modalService.open(contenido, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'servicioTitulo'
    });
  }

  guardar(): void {
    const valores = this.form.getRawValue();
    if (this.enviando) {
      return;
    }
    if (this.form.invalid || valores.tipoServicio === '') {
      this.form.markAllAsTouched();
      return;
    }
    const datos: ServicioRq = {
      codigo: valores.codigo.trim(), nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() || null,
      tipoServicio: valores.tipoServicio, especializacionId: valores.especializacionId, duracionMinutos: Number(valores.duracionMinutos)
    };
    const solicitud = this.seleccionado ? this.servicioService.actualizar(this.seleccionado.id, datos) : this.servicioService.crear(datos);
    this.enviando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message }) => {
        this.modal?.close();
        this.listar();
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.respuestaError = marcarErroresServidor(this.form, error)
        ? '' : mensajeError(error, 'No fue posible guardar el servicio.')
    });
  }

  async cambiarEstado(servicio: Servicio): Promise<void> {
    if (this.cambiandoEstado) {
      return;
    }
    const activo = !servicio.activo;
    this.cambiandoEstado = true;
    const { isConfirmed } = await Swal.fire({
      title: activo ? '¿Activar servicio?' : '¿Inactivar servicio?',
      text: activo ? `${servicio.nombre} volverá a ofrecerse.` : `${servicio.nombre} dejará de ofrecerse en citas y atenciones nuevas.`,
      icon: 'warning', showCancelButton: true, confirmButtonText: activo ? 'Activar' : 'Inactivar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.cambiandoEstado = false;
      return;
    }
    this.servicioService.cambiarEstado(servicio.id, activo).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cambiandoEstado = false)
    ).subscribe({
      next: () => this.listar(),
      error: (error) => void Swal.fire('No se pudo cambiar el estado', mensajeError(error, 'Intenta nuevamente.'), 'error')
    });
  }
}
