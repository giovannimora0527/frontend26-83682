import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { MedioPago } from 'src/app/models/estados';
import { Factura, HistorialFactura } from 'src/app/models/factura';
import { etiquetaDe, MEDIOS_PAGO } from 'src/app/shared/catalogos';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { TieneRolDirective } from 'src/app/shared/directives/tiene-rol.directive';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { FacturaService } from '../service/factura.service';

/** Detalle de una factura: renglones, pagos, historial y anulación. Al cerrarse indica si hubo cambios. */
@Component({
  selector: 'app-factura-modal',
  imports: [ReactiveFormsModule, BadgeEstadoComponent, BotonDescargaComponent, TieneRolDirective, FechaHoraPipe, MonedaPipe],
  templateUrl: './factura-modal.component.html'
})
export class FacturaModalComponent implements OnInit {
  @Input({ required: true }) facturaId!: number;
  /** Abre directamente el formulario de pago. */
  @Input() pagando = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly facturaService = inject(FacturaService);
  readonly modal = inject(NgbActiveModal);
  readonly esInvalido = esInvalido;
  readonly medios = MEDIOS_PAGO;
  readonly form = this.formBuilder.nonNullable.group({
    valor: this.formBuilder.control<number | null>(null, [
      Validators.required, Validators.pattern(/^\d{1,12}(\.\d{1,2})?$/), Validators.min(0.01),
      (control: AbstractControl<number | null>) => (Number(control.value ?? 0) > (this.factura?.saldo ?? 0) ? { superaSaldo: true } : null)
    ]),
    medioPago: this.formBuilder.nonNullable.control<MedioPago | ''>('', Validators.required),
    referencia: ['', [
      Validators.maxLength(100),
      (control: AbstractControl<string>) => {
        const medio = control.parent?.get('medioPago')?.value;
        return medio && medio !== 'EFECTIVO' && !control.value.trim() ? { required: true } : null;
      }
    ]]
  });

  factura: Factura | null = null;
  historial: HistorialFactura[] = [];
  cargando = false;
  error = '';
  procesando = false;
  respuestaError = '';
  cambio = false;

  ngOnInit(): void {
    this.form.controls.medioPago.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.referencia.updateValueAndValidity());
    this.cargar();
  }

  get admitePagos(): boolean {
    return this.factura?.estado === 'PENDIENTE' || this.factura?.estado === 'PAGO_PARCIAL';
  }

  etiquetaMedio(medio: MedioPago): string {
    return etiquetaDe(MEDIOS_PAGO, medio);
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({ factura: this.facturaService.obtener(this.facturaId), historial: this.facturaService.historialEstados(this.facturaId) }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: ({ factura, historial }) => {
        this.factura = factura;
        this.historial = historial;
        this.form.controls.valor.updateValueAndValidity();
      },
      error: (error) => this.error = mensajeError(error, 'No fue posible cargar la factura.')
    });
  }

  pagarSaldo(): void {
    this.form.controls.valor.setValue(this.factura?.saldo ?? null);
  }

  pagar(): void {
    const { valor, medioPago, referencia } = this.form.getRawValue();
    if (this.procesando || !this.factura) {
      return;
    }
    if (this.form.invalid || medioPago === '') {
      this.form.markAllAsTouched();
      return;
    }
    this.procesando = true;
    this.respuestaError = '';
    this.facturaService.pagar(this.facturaId, { valor: Number(valor), medioPago, referencia: referencia.trim() || null }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: ({ message }) => {
        this.cambio = true;
        this.pagando = false;
        this.form.reset();
        this.cargar();
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.respuestaError = marcarErroresServidor(this.form, error)
        ? '' : mensajeError(error, 'No fue posible registrar el pago.')
    });
  }

  async anular(): Promise<void> {
    if (this.procesando || !this.factura) {
      return;
    }
    this.procesando = true;
    const primera = await Swal.fire({
      title: '¿Anular la factura?', text: 'No se borra: queda anulada con su motivo. La cita y lo despachado quedan libres para facturarse de nuevo.', icon: 'warning',
      input: 'textarea', inputLabel: 'Motivo de la anulación', inputAttributes: { maxlength: '255' },
      inputValidator: (motivo) => (motivo.trim() ? null : 'Escribe el motivo.'), showCancelButton: true, confirmButtonText: 'Continuar', cancelButtonText: 'Volver'
    });
    const segunda = primera.isConfirmed ? await Swal.fire({
      title: `Confirma la anulación de ${this.factura.numero}`,
      text: this.factura.pagado > 0
        ? `Tiene pagos por ${new MonedaPipe().transform(this.factura.pagado)} que se conservan y debes gestionar con el propietario.` : 'Esta acción no se puede deshacer.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Anular factura', cancelButtonText: 'Volver'
    }) : null;
    if (!segunda?.isConfirmed) {
      this.procesando = false;
      return;
    }
    this.respuestaError = '';
    this.facturaService.anular(this.facturaId, String(primera.value).trim()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: ({ message }) => {
        this.cambio = true;
        this.pagando = false;
        this.cargar();
        void Swal.fire('Factura anulada', message, 'success');
      },
      error: (error) => this.respuestaError = mensajeError(error, 'No fue posible anular la factura.')
    });
  }
}
