import { Component, DestroyRef, HostListener, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { catchError, EMPTY, finalize, interval, Observable, of, switchMap, tap, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../login/service/auth.service';
import { ServicioService } from '../../tarifas/service/servicio.service';
import { Atencion, AtencionCita, AtencionRq } from 'src/app/models/atencion';
import { Servicio } from 'src/app/models/servicio';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { fechaIso } from 'src/app/shared/utils/fecha.util';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { AntecedentesComponent } from '../antecedentes/antecedentes.component';
import { FormulasCitaComponent } from '../formulas-cita/formulas-cita.component';
import { AtencionService } from '../service/atencion.service';

const AUTOGUARDADO_MS = 60_000;
const MAXIMO_TEXTO = 5000;
type RenglonServicio = FormGroup<{ servicioId: FormControl<number>; cantidad: FormControl<number | null> }>;

function textoObligatorio(control: AbstractControl<string>) {
  return control.value.trim() ? null : { required: true };
}

@Component({
  selector: 'app-atencion-detalle',
  imports: [
    ReactiveFormsModule, RouterLink, NgbNavModule, BadgeEstadoComponent, BotonDescargaComponent, FechaHoraPipe, MonedaPipe, AntecedentesComponent,
    FormulasCitaComponent
  ],
  templateUrl: './atencion-detalle.component.html'
})
export class AtencionDetalleComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly atencionService = inject(AtencionService);
  private readonly servicioService = inject(ServicioService);
  private readonly formulas = viewChild(FormulasCitaComponent);

  readonly esInvalido = esInvalido;
  readonly maximoTexto = MAXIMO_TEXTO;
  readonly campos = [
    { clave: 'motivoConsulta', etiqueta: 'Motivo de la consulta', obligatorio: true },
    { clave: 'sintomas', etiqueta: 'Síntomas', obligatorio: true },
    { clave: 'diagnostico', etiqueta: 'Diagnóstico', obligatorio: true },
    { clave: 'observaciones', etiqueta: 'Observaciones', obligatorio: false },
    { clave: 'recomendaciones', etiqueta: 'Recomendaciones', obligatorio: false }
  ] as const;
  readonly form = this.formBuilder.nonNullable.group({
    motivoConsulta: ['', [textoObligatorio, Validators.maxLength(MAXIMO_TEXTO)]],
    sintomas: ['', [textoObligatorio, Validators.maxLength(MAXIMO_TEXTO)]],
    diagnostico: ['', [textoObligatorio, Validators.maxLength(MAXIMO_TEXTO)]],
    observaciones: ['', Validators.maxLength(MAXIMO_TEXTO)],
    recomendaciones: ['', Validators.maxLength(MAXIMO_TEXTO)],
    servicios: this.formBuilder.array<RenglonServicio>([])
  });

  citaId = 0;
  pestana = 'consulta';
  datos: AtencionCita | null = null;
  cargando = false;
  error = '';
  listServicios: Servicio[] = [];
  errorServicios = '';
  guardando = false;
  private guardarAlTerminar = false;
  finalizando = false;
  respuestaError = '';
  ultimoGuardado: Date | null = null;

  constructor() {
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.citaId = Number(params.get('citaId'));
      if (!Number.isInteger(this.citaId) || this.citaId <= 0) {
        this.error = 'La cita no existe.';
        return;
      }
      this.iniciar();
    });
    this.cargarServicios();
    interval(AUTOGUARDADO_MS).pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.form.dirty && this.editable && !this.guardando && !this.finalizando && this.borradorValido) {
        this.guardar().subscribe();
      }
    });
  }

  get atencion(): Atencion | null {
    return this.datos?.atencion ?? null;
  }

  get editable(): boolean {
    return !!this.atencion && !this.atencion.finalizada;
  }

  /** También se formula el mismo día en que se finalizó. */
  get puedeFormular(): boolean {
    return this.editable || (!!this.atencion?.fechaFin && this.atencion.fechaFin.slice(0, 10) === fechaIso(new Date()));
  }

  get servicios(): FormArray<RenglonServicio> {
    return this.form.controls.servicios;
  }

  /** Un borrador admite textos vacíos, pero no servicios o longitudes inválidas. */
  get borradorValido(): boolean {
    return this.servicios.valid && this.campos.every(({ clave }) => !this.form.controls[clave].hasError('maxlength'));
  }

  iniciar(): void {
    this.cargando = true;
    this.error = '';
    this.atencionService.iniciar(this.citaId).pipe(
      switchMap(() => this.atencionService.obtener(this.citaId)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (datos) => this.mostrar(datos),
      error: (error) => {
        if (error?.status === 409) {
          void Swal.fire('No se puede atender la cita', mensajeError(error, 'Revisa el estado y la hora de la cita.'), 'warning');
          void this.router.navigate(['/inicio/calendario']);
          return;
        }
        this.error = mensajeError(error, 'No fue posible abrir la atención.');
      }
    });
  }

  cargarServicios(): void {
    this.errorServicios = '';
    this.servicioService.listar(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (servicios) => this.listServicios = servicios,
      error: (error) => this.errorServicios = mensajeError(error, 'No fue posible cargar los servicios.')
    });
  }

  private mostrar(datos: AtencionCita): void {
    this.datos = datos;
    const atencion = datos.atencion;
    this.servicios.clear();
    atencion?.servicios.forEach(({ servicioId, cantidad }) => this.servicios.push(this.crearServicio(servicioId, cantidad)));
    this.form.reset({
      motivoConsulta: atencion?.motivoConsulta ?? datos.cita.motivo ?? '',
      sintomas: atencion?.sintomas ?? '',
      diagnostico: atencion?.diagnostico ?? '',
      observaciones: atencion?.observaciones ?? '',
      recomendaciones: atencion?.recomendaciones ?? '',
      servicios: atencion?.servicios.map(({ servicioId, cantidad }) => ({ servicioId, cantidad })) ?? []
    });
    if (this.editable) {
      this.form.enable();
      // Se propone el servicio agendado mientras no haya otros registrados.
      if (!this.servicios.length && datos.cita.servicioId !== null) {
        this.servicios.push(this.crearServicio(datos.cita.servicioId, 1));
        this.form.markAsDirty();
      }
    } else {
      this.form.disable();
    }
  }

  private crearServicio(servicioId: number, cantidad: number): RenglonServicio {
    return this.formBuilder.group({
      servicioId: this.formBuilder.nonNullable.control(servicioId),
      cantidad: this.formBuilder.control<number | null>(cantidad, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(1)])
    });
  }

  get serviciosDisponibles(): Servicio[] {
    const usados = new Set(this.servicios.controls.map((renglon) => renglon.controls.servicioId.value));
    return this.listServicios.filter(({ id }) => !usados.has(id));
  }

  servicioDe(id: number): Servicio | undefined {
    return this.listServicios.find((servicio) => servicio.id === id);
  }

  nombreServicio(id: number): string {
    return this.servicioDe(id)?.nombre ?? this.atencion?.servicios.find(({ servicioId }) => servicioId === id)?.servicioNombre
      ?? (this.datos?.cita.servicioId === id ? this.datos.cita.servicioNombre : null) ?? `Servicio ${id}`;
  }

  totalServicio(renglon: RenglonServicio): number {
    const { servicioId, cantidad } = renglon.getRawValue();
    const tarifa = this.servicioDe(servicioId)?.tarifaVigente;
    return tarifa ? tarifa.valor * Number(cantidad ?? 0) * (1 + tarifa.porcentajeIva / 100) : 0;
  }

  get subtotal(): number {
    return this.servicios.controls.reduce((suma, renglon) => suma + this.totalServicio(renglon), 0);
  }

  agregarServicio(selector: HTMLSelectElement): void {
    const id = Number(selector.value);
    if (id && this.serviciosDisponibles.some((servicio) => servicio.id === id)) {
      this.servicios.push(this.crearServicio(id, 1));
      this.form.markAsDirty();
    }
    selector.value = '';
  }

  quitarServicio(indice: number): void {
    this.servicios.removeAt(indice);
    this.form.markAsDirty();
  }

  guardarBorrador(): void {
    if (this.finalizando) {
      return;
    }
    if (this.guardando) {
      // Coincidió con otro guardado (por ejemplo, el automático): se repite al terminar si quedan cambios.
      this.guardarAlTerminar = true;
      return;
    }
    if (!this.borradorValido) {
      this.respuestaError = 'Corrige las cantidades de los servicios antes de guardar.';
      this.servicios.markAllAsTouched();
      return;
    }
    this.guardar().subscribe();
  }

  /** Emite solo si se guardó. Si el médico siguió escribiendo, el formulario conserva sus cambios pendientes. */
  private guardar(): Observable<unknown> {
    const atencion = this.atencion;
    if (!atencion) {
      return EMPTY;
    }
    const datos = this.datosFormulario();
    const enviado = JSON.stringify(datos);
    this.guardando = true;
    this.respuestaError = '';
    return this.atencionService.guardar(atencion.id, datos).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.guardando = false;
        const repetir = this.guardarAlTerminar && this.form.dirty && this.editable && !this.finalizando;
        this.guardarAlTerminar = false;
        if (repetir) {
          this.guardarBorrador();
        }
      }),
      tap(() => {
        this.ultimoGuardado = new Date();
        if (JSON.stringify(this.datosFormulario()) === enviado) {
          this.form.markAsPristine();
        }
      }),
      catchError((error) => {
        this.respuestaError = marcarErroresServidor(this.form, error) ? 'Revisa los campos marcados.' : mensajeError(error, 'No fue posible guardar el borrador.');
        return EMPTY;
      })
    );
  }

  private datosFormulario(): AtencionRq {
    const v = this.form.getRawValue();
    return {
      motivoConsulta: v.motivoConsulta.trim() || null, sintomas: v.sintomas.trim() || null, diagnostico: v.diagnostico.trim() || null,
      observaciones: v.observaciones.trim() || null, recomendaciones: v.recomendaciones.trim() || null,
      servicios: v.servicios.map(({ servicioId, cantidad }) => ({ servicioId, cantidad: Number(cantidad) }))
    };
  }

  /** Motivo por el que no se puede finalizar, o null. Lleva a la pestaña correspondiente. */
  private impedimento(): string | null {
    if (this.campos.some(({ clave }) => this.form.controls[clave].invalid)) {
      this.pestana = 'consulta';
      this.form.markAllAsTouched();
      return 'Completa el motivo, los síntomas y el diagnóstico.';
    }
    if (!this.servicios.length || this.servicios.invalid) {
      this.pestana = 'servicios';
      this.servicios.markAllAsTouched();
      return 'Registra al menos un servicio con una cantidad válida.';
    }
    const formulas = this.formulas();
    if (formulas?.hayCambiosSinGuardar) {
      this.pestana = 'formula';
      return 'Guarda o descarta los cambios de la fórmula.';
    }
    if (formulas?.hayBorradores) {
      this.pestana = 'formula';
      return 'Confirma o anula las fórmulas en borrador.';
    }
    return null;
  }

  async finalizar(): Promise<void> {
    const atencion = this.atencion;
    if (!atencion || this.finalizando || this.guardando) {
      return;
    }
    const impedimento = this.impedimento();
    if (impedimento) {
      this.respuestaError = impedimento;
      return;
    }
    this.finalizando = true;
    const { isConfirmed } = await Swal.fire({
      title: '¿Finalizar la atención?', text: 'Ya no se podrán modificar la consulta ni los servicios.', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Finalizar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.finalizando = false;
      return;
    }
    const previo: Observable<unknown> = this.form.dirty ? this.guardar() : of(null);
    previo.pipe(
      switchMap(() => this.atencionService.finalizar(atencion.id)),
      switchMap(({ message }) => this.atencionService.obtener(this.citaId).pipe(
        tap((datos) => this.mostrar(datos)),
        // La atención ya quedó finalizada: si falla la recarga, se bloquea la edición y se avisa.
        catchError((error) => {
          this.form.disable();
          atencion.finalizada = true;
          this.form.markAsPristine();
          return throwError(() => error);
        }),
        switchMap(() => of(message))
      )),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.finalizando = false)
    ).subscribe({
      next: (mensaje) => void Swal.fire('Operación exitosa', mensaje, 'success'),
      error: (error) => {
        this.respuestaError = marcarErroresServidor(this.form, error)
          ? 'Revisa los campos marcados.' : mensajeError(error, 'No fue posible completar la operación.');
        if (error?.status === 409) {
          void Swal.fire('No se pudo finalizar', mensajeError(error, 'Intenta nuevamente.'), 'error');
        }
      }
    });
  }

  private get hayCambios(): boolean {
    return (this.form.dirty && this.editable) || !!this.formulas()?.hayCambiosSinGuardar;
  }

  /** Guarda de salida. Si la sesión terminó, no se puede guardar y no se pregunta. */
  async puedeSalir(): Promise<boolean> {
    if (!this.hayCambios || !this.authService.isAuthenticated()) {
      return true;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Salir sin guardar?', text: 'Hay cambios sin guardar en la atención.', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Salir', cancelButtonText: 'Quedarme'
    });
    return isConfirmed;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarCierre(event: BeforeUnloadEvent): void {
    if (this.hayCambios) {
      event.preventDefault();
    }
  }
}
