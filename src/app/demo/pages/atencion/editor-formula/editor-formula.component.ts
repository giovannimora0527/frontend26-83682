import { Component, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { distinctUntilChanged, finalize, map, merge, Observable, of, OperatorFunction, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InventarioService } from '../../inventario/service/inventario.service';
import { cantidadSugerida } from '../../formula-medica/formula.util';
import { FormulaService } from '../../formula-medica/service/formula.service';
import { ViaAdministracion } from 'src/app/models/estados';
import { FormulaDetalle, FormulaDetalleRq, FormulaMedica, FormulaMedicaRq } from 'src/app/models/formula-medica';
import { VIAS_ADMINISTRACION } from 'src/app/shared/catalogos';
import { esInvalido } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { filtrar } from 'src/app/shared/utils/tabla.util';

/** Lo que se necesita de un medicamento en el renglón. */
export interface MedicamentoOpcion {
  id: number;
  codigo: string;
  nombre: string;
  presentacion: string | null;
}

export const FRECUENCIAS = [4, 6, 8, 12, 24];
const ENTERO = Validators.pattern(/^\d+$/);

function sinRepetidos(detalles: AbstractControl): ValidationErrors | null {
  const ids = (detalles.value as { medicamento: MedicamentoOpcion | null }[]).flatMap(({ medicamento }) => medicamento?.id ?? []);
  return new Set(ids).size < ids.length ? { repetidos: true } : null;
}

@Component({
  selector: 'app-editor-formula',
  imports: [ReactiveFormsModule, NgbTypeahead],
  templateUrl: './editor-formula.component.html'
})
export class EditorFormulaComponent implements OnInit {
  readonly citaId = input.required<number>();
  /** Borrador a editar; null crea una fórmula nueva. */
  readonly formula = input<FormulaMedica | null>(null);
  readonly guardada = output<string>();
  readonly cerrar = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly formulaService = inject(FormulaService);
  private readonly inventarioService = inject(InventarioService);

  readonly vias = VIAS_ADMINISTRACION;
  readonly frecuencias = FRECUENCIAS;
  readonly esInvalido = esInvalido;
  readonly form = this.formBuilder.nonNullable.group({
    indicacionesGenerales: ['', Validators.maxLength(2000)],
    detalles: this.formBuilder.array([this.crearRenglon()], sinRepetidos)
  });

  medicamentos: MedicamentoOpcion[] = [];
  cargandoMedicamentos = false;
  errorMedicamentos = '';
  disponibilidad: Record<number, number | 'error'> = {};
  enviando = false;
  respuestaError = '';

  readonly formato = (opcion: MedicamentoOpcion) => [opcion.codigo, opcion.nombre, opcion.presentacion].filter(Boolean).join(' - ');
  readonly buscar: OperatorFunction<string, MedicamentoOpcion[]> = (texto$) => texto$.pipe(
    distinctUntilChanged(),
    map((texto) => filtrar(this.medicamentos, texto, (m) => [m.codigo, m.nombre, m.presentacion]).slice(0, 10))
  );

  get detalles(): FormArray<ReturnType<EditorFormulaComponent['crearRenglon']>> {
    return this.form.controls.detalles;
  }

  ngOnInit(): void {
    const formula = this.formula();
    if (formula) {
      this.form.controls.indicacionesGenerales.setValue(formula.indicacionesGenerales ?? '');
      this.detalles.clear();
      formula.detalles.forEach((detalle) => this.detalles.push(this.crearRenglon(detalle)));
      this.form.markAsPristine();
    }
    this.cargarMedicamentos();
  }

  cargarMedicamentos(): void {
    this.cargandoMedicamentos = true;
    this.errorMedicamentos = '';
    this.inventarioService.listarProductos().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoMedicamentos = false)
    ).subscribe({
      next: (productos) => this.medicamentos = productos.filter(({ activo, tipoProducto }) => activo && tipoProducto === 'MEDICAMENTO'),
      error: (error) => this.errorMedicamentos = mensajeError(error, 'No fue posible cargar los medicamentos.')
    });
  }

  private crearRenglon(detalle?: FormulaDetalle) {
    const personalizada = detalle !== undefined && !FRECUENCIAS.includes(detalle.frecuenciaHoras);
    const renglon = this.formBuilder.nonNullable.group({
      medicamento: this.formBuilder.control<MedicamentoOpcion | null>(detalle ? {
        id: detalle.medicamentoId, codigo: detalle.medicamentoCodigo, nombre: detalle.medicamentoNombre, presentacion: detalle.presentacion
      } : null, Validators.required),
      dosis: this.formBuilder.control<number | null>(detalle?.dosis ?? null, [
        Validators.required, Validators.pattern(/^\d{1,6}(\.\d{1,2})?$/), Validators.min(0.01)
      ]),
      unidadDosis: [detalle?.unidadDosis ?? '', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)]],
      frecuenciaOpcion: [detalle === undefined ? '' : personalizada ? 'otra' : String(detalle.frecuenciaHoras), Validators.required],
      frecuenciaHoras: this.formBuilder.control<number | null>(detalle?.frecuenciaHoras ?? null, [
        Validators.required, ENTERO, Validators.min(1), Validators.max(168)
      ]),
      duracionDias: this.formBuilder.control<number | null>(detalle?.duracionDias ?? null, [
        Validators.required, ENTERO, Validators.min(1), Validators.max(730)
      ]),
      viaAdministracion: this.formBuilder.nonNullable.control<ViaAdministracion | ''>(detalle?.viaAdministracion ?? '', Validators.required),
      cantidadPrescrita: this.formBuilder.control<number | null>(detalle?.cantidadPrescrita ?? null, [Validators.required, ENTERO, Validators.min(1)]),
      indicaciones: [detalle?.indicaciones ?? '', Validators.maxLength(500)]
    });
    const { medicamento, dosis, frecuenciaOpcion, frecuenciaHoras, duracionDias, cantidadPrescrita } = renglon.controls;
    // La cantidad sigue a la sugerida hasta que el médico la cambie.
    let ajustada = detalle !== undefined && detalle.cantidadPrescrita !== detalle.cantidadSugerida;
    const hasta = takeUntilDestroyed(this.destroyRef);
    frecuenciaOpcion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((opcion) =>
      frecuenciaHoras.setValue(opcion === 'otra' || opcion === '' ? null : Number(opcion)));
    merge(dosis.valueChanges, frecuenciaHoras.valueChanges, duracionDias.valueChanges).pipe(hasta).subscribe(() => {
      const sugerida = cantidadSugerida(dosis.value, frecuenciaHoras.value, duracionDias.value);
      if (!ajustada && sugerida !== null) {
        cantidadPrescrita.setValue(sugerida, { emitEvent: false });
      }
    });
    cantidadPrescrita.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cantidad) =>
      ajustada = cantidad !== null && cantidad !== cantidadSugerida(dosis.value, frecuenciaHoras.value, duracionDias.value));
    medicamento.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((opcion) => this.consultarDisponibilidad(opcion));
    if (detalle) {
      this.consultarDisponibilidad(medicamento.value);
    }
    return renglon;
  }

  private consultarDisponibilidad(medicamento: MedicamentoOpcion | null): void {
    if (!medicamento?.id) {
      return;
    }
    const { id } = medicamento;
    of(id).pipe(
      switchMap(() => this.inventarioService.obtenerDisponibilidad(id)),
      map(({ cantidadDisponibleVigente }): number | 'error' => cantidadDisponibleVigente),
      catchError((): Observable<'error'> => of('error')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((cantidad) => this.disponibilidad = { ...this.disponibilidad, [id]: cantidad });
  }

  agregar(): void {
    this.detalles.push(this.crearRenglon());
    this.form.markAsDirty();
  }

  quitar(indice: number): void {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(indice);
      this.form.markAsDirty();
    }
  }

  disponible(indice: number): number | 'error' | undefined {
    const id = this.detalles.at(indice).controls.medicamento.value?.id;
    return id === undefined ? undefined : this.disponibilidad[id];
  }

  /** Verde si alcanza, amarillo si alcanza en parte, rojo si no hay. */
  colorDisponible(indice: number): string {
    const disponible = this.disponible(indice);
    const cantidad = Number(this.detalles.at(indice).controls.cantidadPrescrita.value ?? 0);
    return disponible === 'error' ? 'bg-secondary' : !disponible ? 'bg-danger' : disponible < cantidad ? 'bg-warning text-dark' : 'bg-success';
  }

  noAlcanza(indice: number): boolean {
    const disponible = this.disponible(indice);
    return typeof disponible === 'number' && Number(this.detalles.at(indice).controls.cantidadPrescrita.value ?? 0) > disponible;
  }

  sugerida(indice: number): number | null {
    const { dosis, frecuenciaHoras, duracionDias } = this.detalles.at(indice).getRawValue();
    return cantidadSugerida(dosis, frecuenciaHoras, duracionDias);
  }

  usarSugerida(indice: number): void {
    this.detalles.at(indice).controls.cantidadPrescrita.setValue(this.sugerida(indice));
    this.form.markAsDirty();
  }

  guardar(): void {
    if (this.enviando) {
      return;
    }
    const { indicacionesGenerales, detalles } = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.respuestaError = this.detalles.hasError('repetidos')
        ? 'No repitas un medicamento en la misma fórmula.' : 'Completa los campos marcados.';
      return;
    }
    const datos: FormulaMedicaRq = {
      citaId: this.citaId(),
      indicacionesGenerales: indicacionesGenerales.trim() || null,
      detalles: detalles.flatMap((d): FormulaDetalleRq[] => d.medicamento === null || d.viaAdministracion === '' ? [] : [{
        medicamentoId: d.medicamento.id, dosis: Number(d.dosis), unidadDosis: d.unidadDosis.trim(), frecuenciaHoras: Number(d.frecuenciaHoras),
        duracionDias: Number(d.duracionDias), viaAdministracion: d.viaAdministracion, cantidadPrescrita: Number(d.cantidadPrescrita),
        indicaciones: d.indicaciones.trim() || null
      }])
    };
    const formula = this.formula();
    const solicitud = formula ? this.formulaService.actualizar(formula.id, datos) : this.formulaService.crear(datos);
    this.enviando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message }) => {
        this.form.markAsPristine();
        this.guardada.emit(message);
      },
      error: (error) => this.respuestaError = mensajeError(error, 'No fue posible guardar la fórmula.')
    });
  }
}
