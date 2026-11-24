import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { distinctUntilChanged, finalize, Observable, skip, startWith, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../login/service/auth.service';
import { Despacho, DespachoDetalle, DespachoFormula, DespachoItemRq, HistorialFormula } from 'src/app/models/despacho';
import { EstadoDespacho, ViaAdministracion } from 'src/app/models/estados';
import { ErrorApi } from 'src/app/models/respuesta';
import { etiquetaDe, VIAS_ADMINISTRACION } from 'src/app/shared/catalogos';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { nuevoUuid } from 'src/app/shared/utils/uuid.util';
import { ESTADOS_PENDIENTES, estadoEsperado } from '../despacho.util';
import { DespachoService } from '../service/despacho.service';

type ControlLote = FormControl<number | null>;
type GrupoDetalle = FormGroup<{ lotes: FormArray<ControlLote> }>;
const claveLote = (detalleId: number, loteId: number) => `${detalleId}-${loteId}`;

/** La suma de los lotes no puede superar lo pendiente del medicamento. */
function maximoPendiente(pendiente: number): (grupo: AbstractControl) => ValidationErrors | null {
  return (grupo) => {
    const suma = (grupo as GrupoDetalle).controls.lotes.getRawValue().reduce<number>((total, cantidad) => total + Number(cantidad ?? 0), 0);
    return suma > pendiente ? { superaPendiente: true } : null;
  };
}

@Component({
  selector: 'app-preparacion',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, NgbNavModule, BadgeEstadoComponent, BotonDescargaComponent, FechaHoraPipe],
  templateUrl: './preparacion.component.html'
})
export class PreparacionComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly despachoService = inject(DespachoService);
  private readonly usuario = inject(AuthService).obtenerUsuario()?.username;
  private formulaId = 0;
  private consulta?: Subscription;
  /** Clave de la confirmación en curso. Se conserva si no hubo respuesta, para que el reintento no descuente dos veces. */
  private claveIdempotencia: string | null = null;

  readonly estadosUi = ESTADOS_UI;
  readonly form = this.formBuilder.group({
    detalles: this.formBuilder.array<GrupoDetalle>([]),
    observacion: this.formBuilder.nonNullable.control('', Validators.maxLength(500))
  });

  pestana = 'preparacion';
  datos: DespachoFormula | null = null;
  cargando = false;
  error = '';
  procesando = false;
  respuestaError = '';
  erroresLote: Record<string, string[]> = {};
  resultado: Despacho | null = null;
  historial: HistorialFormula[] = [];
  cargandoHistorial = false;
  errorHistorial = '';

  constructor() {
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.formulaId = Number(params.get('formulaId'));
      if (!Number.isInteger(this.formulaId) || this.formulaId <= 0) {
        this.error = 'La fórmula no existe.';
        return;
      }
      this.cargar();
    });
  }

  get detallesForm(): FormArray<GrupoDetalle> {
    return this.form.controls.detalles;
  }

  get enCurso(): boolean {
    return !!this.datos?.despachoId;
  }

  get esMia(): boolean {
    return this.enCurso && this.datos?.usuarioPreparacion === this.usuario;
  }

  get pendiente(): boolean {
    return !!this.datos && ESTADOS_PENDIENTES.includes(this.datos.estadoDespacho);
  }

  /** Con entregas, solo el ADMINISTRADOR cancela. */
  get cancelable(): boolean {
    return this.pendiente && (!this.enCurso || this.esMia) && !!this.datos?.detalles.every(({ cantidadDespachada }) => cantidadDespachada === 0);
  }

  etiquetaVia(via: ViaAdministracion): string {
    return etiquetaDe(VIAS_ADMINISTRACION, via);
  }

  diasParaVencer(fecha: string | null): number | null {
    if (!fecha) {
      return null;
    }
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const hoy = new Date();
    return Math.round((Date.UTC(anio, mes - 1, dia) - Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86_400_000);
  }

  cargar(conservar = false): void {
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.consulta = this.despachoService.obtener(this.formulaId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (datos) => this.mostrar(datos, conservar),
      error: (error) => this.error = mensajeError(error, 'No fue posible cargar la fórmula.')
    });
  }

  /** Arma el formulario con la sugerencia FEFO o, si se conserva, con lo que ya había escrito el usuario. */
  private mostrar(datos: DespachoFormula, conservar = false): void {
    const anteriores = new Map<string, number | null>();
    if (conservar && this.datos) {
      this.datos.detalles.forEach((detalle, d) => detalle.lotes.forEach((lote, l) =>
        anteriores.set(claveLote(detalle.formulaDetalleId, lote.loteId), this.control(d, l).value)));
    } else {
      this.erroresLote = {};
    }
    this.datos = datos;
    this.detallesForm.clear();
    for (const detalle of datos.detalles) {
      const lotes = detalle.lotes.map((lote) => {
        const clave = claveLote(detalle.formulaDetalleId, lote.loteId);
        const valor = lote.vencido ? 0 : anteriores.has(clave) ? anteriores.get(clave) ?? null : lote.cantidadSugerida;
        const control: ControlLote = this.formBuilder.control<number | null>(valor, [
          Validators.required, Validators.pattern(/^\d+$/), Validators.min(0), Validators.max(lote.cantidadDisponible)
        ]);
        if (lote.vencido) {
          control.disable();
        }
        // La marca del backend se quita solo si cambia la cantidad, no al revalidar.
        control.valueChanges.pipe(startWith(valor), distinctUntilChanged(), skip(1), takeUntilDestroyed(this.destroyRef))
          .subscribe(() => delete this.erroresLote[clave]);
        return control;
      });
      this.detallesForm.push(this.formBuilder.group({ lotes: this.formBuilder.array(lotes) }, { validators: maximoPendiente(detalle.cantidadPendiente) }));
    }
  }

  control(detalle: number, lote: number): ControlLote {
    return this.detallesForm.at(detalle).controls.lotes.at(lote);
  }

  errores(detalle: DespachoDetalle, loteId: number): string[] {
    return this.erroresLote[claveLote(detalle.formulaDetalleId, loteId)] ?? [];
  }

  mensajeLote(d: number, l: number): string {
    const control = this.control(d, l);
    const disponible = this.datos?.detalles[d].lotes[l].cantidadDisponible;
    return control.hasError('max') ? `El lote solo tiene ${disponible}.` : control.invalid ? 'Escribe un entero de 0 en adelante.' : '';
  }

  entrega(indice: number): number {
    return this.detallesForm.at(indice).controls.lotes.getRawValue().reduce<number>((total, cantidad) => total + Number(cantidad ?? 0), 0);
  }

  usarSugerencia(indice: number): void {
    this.datos?.detalles[indice].lotes.forEach(({ cantidadSugerida }, l) => this.control(indice, l).setValue(cantidadSugerida));
  }

  entregarCero(indice: number): void {
    this.detallesForm.at(indice).controls.lotes.controls.forEach((control) => control.setValue(0));
  }

  get items(): DespachoItemRq[] {
    return (this.datos?.detalles ?? []).flatMap((detalle, d) => detalle.lotes.flatMap((lote, l) => {
      const cantidad = Number(this.control(d, l).value ?? 0);
      return cantidad > 0 && !lote.vencido ? [{ formulaDetalleId: detalle.formulaDetalleId, loteId: lote.loteId, cantidad }] : [];
    }));
  }

  get medicamentosEntregados(): number {
    return (this.datos?.detalles ?? []).filter((_, d) => this.entrega(d) > 0).length;
  }

  get estadoPrevisto(): EstadoDespacho {
    const detalles = this.datos?.detalles ?? [];
    return estadoEsperado(detalles, new Map(detalles.map(({ formulaDetalleId }, d) => [formulaDetalleId, this.entrega(d)])));
  }

  /** Por qué no se puede confirmar, o cadena vacía. */
  get impedimento(): string {
    if (this.detallesForm.controls.some((grupo) => grupo.hasError('superaPendiente'))) {
      return 'Hay medicamentos con más cantidad que la pendiente.';
    }
    if (this.form.invalid) {
      return 'Corrige las cantidades marcadas.';
    }
    const hayExistencias = this.datos?.detalles.some(({ cantidadPendiente, existenciaTotalVigente }) => cantidadPendiente > 0 && existenciaTotalVigente > 0);
    return !this.items.length && hayExistencias ? 'Hay existencias por entregar: indica cantidades o libera la preparación.' : '';
  }

  preparar(): void {
    this.ejecutar(this.despachoService.preparar(this.formulaId), ({ data }) => data ? this.mostrar(data) : this.cargar(), () => this.cargar());
  }

  async confirmar(): Promise<void> {
    const despachoId = this.datos?.despachoId;
    if (!despachoId || !this.esMia || this.procesando || this.impedimento) {
      return;
    }
    const items = this.items;
    this.procesando = true;
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar el despacho?',
      text: `${this.resumen} Se descontará del inventario y no se puede deshacer desde aquí.`,
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirmar despacho', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.procesando = false;
      return;
    }
    this.claveIdempotencia ??= nuevoUuid();
    this.respuestaError = '';
    this.erroresLote = {};
    const observacion = this.form.controls.observacion.value.trim() || null;
    this.despachoService.confirmar(despachoId, { observacion, items }, this.claveIdempotencia).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: ({ message, data }) => {
        this.claveIdempotencia = null;
        this.resultado = data ?? null;
        this.form.controls.observacion.reset();
        this.cargar();
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.manejarErrorConfirmar(error, items)
    });
  }

  private manejarErrorConfirmar(error: unknown, items: DespachoItemRq[]): void {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 0 || estado >= 500) {
      // Sin respuesta definitiva: pudo haberse registrado. El reintento usa la misma clave.
      this.respuestaError = 'No hubo respuesta del servidor. Puedes volver a confirmar: si ya se registró, no se descontará otra vez.';
      return;
    }
    this.claveIdempotencia = null;
    this.respuestaError = mensajeError(error, 'No fue posible confirmar el despacho.');
    const detalles = ((error as HttpErrorResponse).error as Partial<ErrorApi> | null)?.detalles;
    const erroresLote: Record<string, string[]> = {};
    for (const { campo, mensaje } of Array.isArray(detalles) ? detalles : []) {
      const item = items[Number(/^items\[(\d+)\]/.exec(campo)?.[1] ?? -1)];
      if (item) {
        (erroresLote[claveLote(item.formulaDetalleId, item.loteId)] ??= []).push(mensaje);
      }
    }
    if (estado === 409) {
      this.cargar(true);
    }
    this.erroresLote = erroresLote;
  }

  get resumen(): string {
    return `Se entregarán ${this.medicamentosEntregados} de ${this.datos?.detalles.length ?? 0} medicamentos; quedará en estado: ${ESTADOS_UI[this.estadoPrevisto].etiqueta}.`;
  }

  async liberar(): Promise<void> {
    const despachoId = this.datos?.despachoId;
    if (!despachoId || this.procesando) {
      return;
    }
    this.procesando = true;
    const { isConfirmed } = await Swal.fire({
      title: '¿Liberar la preparación?', text: 'No se entrega nada y otra persona podrá preparar la fórmula.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Liberar', cancelButtonText: 'Cancelar'
    });
    this.procesando = false;
    if (isConfirmed) {
      this.ejecutar(this.despachoService.liberar(despachoId), ({ message, data }) => {
        if (data) {
          this.mostrar(data);
        }
        void Swal.fire('Operación exitosa', message, 'success');
      });
    }
  }

  async cancelar(): Promise<void> {
    if (this.procesando) {
      return;
    }
    this.procesando = true;
    const { isConfirmed, value } = await Swal.fire({
      title: '¿Cancelar el despacho?', text: 'La fórmula ya no se podrá despachar.', icon: 'warning', input: 'textarea', inputLabel: 'Motivo',
      inputAttributes: { maxlength: '255' }, inputValidator: (motivo) => (motivo.trim() ? null : 'Escribe el motivo.'),
      showCancelButton: true, confirmButtonText: 'Cancelar despacho', cancelButtonText: 'Volver'
    });
    this.procesando = false;
    if (isConfirmed) {
      this.ejecutar(this.despachoService.cancelar(this.formulaId, String(value).trim()), ({ message, data }) => {
        if (data) {
          this.mostrar(data);
        }
        void Swal.fire('Operación exitosa', message, 'success');
      });
    }
  }

  private ejecutar<T>(solicitud: Observable<T>, exito: (respuesta: T) => void, trasError?: () => void): void {
    if (this.procesando) {
      return;
    }
    this.procesando = true;
    this.respuestaError = '';
    this.resultado = null;
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: exito,
      error: (error) => {
        this.respuestaError = mensajeError(error, 'No fue posible completar la operación.');
        trasError?.();
      }
    });
  }

  cambiarPestana(pestana: string): void {
    if (pestana === 'historial') {
      this.cargarHistorial();
    }
  }

  cargarHistorial(): void {
    this.cargandoHistorial = true;
    this.errorHistorial = '';
    this.despachoService.historialEstados(this.formulaId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoHistorial = false)
    ).subscribe({
      next: (historial) => this.historial = historial,
      error: (error) => this.errorHistorial = mensajeError(error, 'No fue posible cargar el historial.')
    });
  }
}
