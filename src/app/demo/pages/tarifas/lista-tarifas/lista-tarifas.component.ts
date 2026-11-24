import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { Servicio } from 'src/app/models/servicio';
import { Impuesto, Tarifa } from 'src/app/models/tarifa';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { fechaIso } from 'src/app/shared/utils/fecha.util';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { ServicioService } from '../service/servicio.service';
import { TarifaService } from '../service/tarifa.service';

@Component({
  selector: 'app-lista-tarifas',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, BotonOrdenComponent, PaginacionComponent, MonedaPipe],
  templateUrl: './lista-tarifas.component.html'
})
export class ListaTarifasComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly formBuilder = inject(FormBuilder);
  private readonly tarifaService = inject(TarifaService);
  private readonly servicioService = inject(ServicioService);
  private modal?: NgbModalRef;
  private tarifas: Tarifa[] = [];

  readonly esInvalido = esInvalido;
  readonly hoy = fechaIso(new Date());
  readonly columnas = [
    { clave: 'servicio', titulo: 'Servicio' }, { clave: 'valor', titulo: 'Valor' }, { clave: 'impuesto', titulo: 'Impuesto' },
    { clave: 'desde', titulo: 'Vigente desde' }, { clave: 'hasta', titulo: 'Vigente hasta' }, { clave: 'estado', titulo: 'Estado' }
  ];
  readonly tabla = new Tabla<Tarifa>(
    {
      servicio: (t) => `${t.servicioNombre} ${t.servicioCodigo}`,
      valor: (t) => t.valor,
      impuesto: (t) => t.impuestoNombre,
      desde: (t) => t.vigenteDesde,
      hasta: (t) => t.vigenteHasta,
      estado: (t) => (t.activa ? 'Vigente' : 'Cerrada')
    },
    'servicio'
  );
  readonly form = this.formBuilder.nonNullable.group({
    servicioId: this.formBuilder.control<number | null>(null, Validators.required),
    valor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.pattern(/^\d{1,12}(\.\d{1,2})?$/)]),
    impuestoId: this.formBuilder.control<number | null>(null, Validators.required),
    vigenteDesde: [this.hoy, [Validators.required]],
    motivo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]]
  });

  soloVigentes = true;
  servicios: Servicio[] = [];
  impuestos: Impuesto[] = [];
  cargando = false;
  errorListado = '';
  seleccionada: Tarifa | null = null;
  enviando = false;
  respuestaError = '';

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    forkJoin({
      tarifas: this.tarifaService.listar(), servicios: this.servicioService.listar(), impuestos: this.tarifaService.listarImpuestos()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: ({ tarifas, servicios, impuestos }) => {
        this.tarifas = tarifas;
        this.servicios = servicios;
        this.impuestos = impuestos;
        this.filtrar();
      },
      error: (error) => this.errorListado = mensajeError(error, 'No fue posible cargar las tarifas.')
    });
  }

  filtrar(): void {
    this.tabla.items = this.tarifas.filter(({ activa }) => activa || !this.soloVigentes);
  }

  get serviciosSinTarifa(): Servicio[] {
    return this.servicios.filter(({ activo, tarifaVigente }) => activo && !tarifaVigente);
  }

  /** Impuestos activos, más el que ya tiene la tarifa. */
  get impuestosDisponibles(): Impuesto[] {
    return this.impuestos.filter(({ id, activo }) => activo || id === this.seleccionada?.impuestoId);
  }

  get impuestoElegido(): Impuesto | undefined {
    return this.impuestos.find(({ id }) => id === this.form.controls.impuestoId.value);
  }

  get sinCambios(): boolean {
    const { valor, impuestoId } = this.form.getRawValue();
    return !!this.seleccionada && Number(valor) === this.seleccionada.valor && impuestoId === this.seleccionada.impuestoId;
  }

  abrir(tarifa: Tarifa | null, contenido: TemplateRef<unknown>): void {
    this.seleccionada = tarifa;
    const { servicioId, vigenteDesde, motivo } = this.form.controls;
    // Al crear no hay motivo; al cambiar, el servicio y la vigencia no se tocan.
    for (const control of [servicioId, vigenteDesde]) {
      if (tarifa) {
        control.disable();
      } else {
        control.enable();
      }
    }
    if (tarifa) {
      motivo.enable();
    } else {
      motivo.disable();
    }
    this.form.reset({
      servicioId: tarifa?.servicioId ?? null, valor: tarifa?.valor ?? null, impuestoId: tarifa?.impuestoId ?? null,
      vigenteDesde: tarifa?.vigenteDesde ?? this.hoy, motivo: ''
    });
    this.respuestaError = '';
    this.modal = this.modalService.open(contenido, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'tarifaTitulo'
    });
  }

  guardar(): void {
    const { servicioId, valor, impuestoId, vigenteDesde, motivo } = this.form.getRawValue();
    if (this.enviando) {
      return;
    }
    if (this.form.invalid || servicioId === null || impuestoId === null) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.sinCambios) {
      this.respuestaError = 'Cambia el valor o el impuesto para registrar una tarifa nueva.';
      return;
    }
    if (!this.seleccionada && vigenteDesde > this.hoy) {
      this.respuestaError = 'Las tarifas no se programan a futuro.';
      return;
    }
    const solicitud = this.seleccionada
      ? this.tarifaService.actualizar(this.seleccionada.id, { valor: Number(valor), impuestoId, motivo: motivo.trim() })
      : this.tarifaService.crear({ servicioId, valor: Number(valor), impuestoId, vigenteDesde });
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
        ? '' : mensajeError(error, 'No fue posible guardar la tarifa.')
    });
  }
}
