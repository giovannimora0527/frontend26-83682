import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { DescuentoRq, FacturaDetalle, FacturaPrevia, TotalesFactura } from 'src/app/models/factura';
import { ErrorApi } from 'src/app/models/respuesta';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { esInvalido } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { aplicarDescuento, totalizar } from '../factura.util';
import { FacturaService } from '../service/factura.service';

type Renglon = FormGroup<{ porcentaje: FormControl<number | null>; motivo: FormControl<string> }>;

function motivoConDescuento(renglon: { value: unknown }): ValidationErrors | null {
  const { porcentaje, motivo } = renglon.value as { porcentaje: number | null; motivo: string };
  return Number(porcentaje ?? 0) > 0 && !motivo.trim() ? { sinMotivo: true } : null;
}

/** Previsualización y generación. Se cierra con la factura creada. */
@Component({
  selector: 'app-generar-factura',
  imports: [ReactiveFormsModule, FechaHoraPipe, MonedaPipe],
  templateUrl: './generar-factura.component.html'
})
export class GenerarFacturaComponent implements OnInit {
  @Input({ required: true }) citaId!: number;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly facturaService = inject(FacturaService);
  readonly modal = inject(NgbActiveModal);
  readonly esInvalido = esInvalido;
  readonly form = this.formBuilder.nonNullable.group({
    observacion: ['', Validators.maxLength(500)],
    renglones: this.formBuilder.array<Renglon>([])
  });

  previa: FacturaPrevia | null = null;
  cargando = false;
  error = '';
  enviando = false;
  respuestaError = '';

  get renglones(): FormArray<Renglon> {
    return this.form.controls.renglones;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.facturaService.previsualizar(this.citaId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (previa) => {
        this.previa = previa;
        this.renglones.clear();
        previa.detalles.forEach(() => this.renglones.push(this.formBuilder.nonNullable.group({
          porcentaje: this.formBuilder.control<number | null>(null, [
            Validators.pattern(/^\d{1,3}(\.\d{1,2})?$/), Validators.min(0), Validators.max(Math.min(100, previa.topeDescuento))
          ]),
          motivo: ['', Validators.maxLength(255)]
        }, { validators: motivoConDescuento })));
      },
      error: (error) => this.error = mensajeError(error, 'No fue posible previsualizar la factura.')
    });
  }

  porcentaje(indice: number): number {
    const { porcentaje } = this.renglones.at(indice).controls;
    return porcentaje.valid ? Number(porcentaje.value ?? 0) : 0;
  }

  get calculados(): FacturaDetalle[] {
    return (this.previa?.detalles ?? []).map((detalle, i) => aplicarDescuento(detalle, this.porcentaje(i)));
  }

  get totales(): TotalesFactura {
    return totalizar(this.calculados);
  }

  async generar(): Promise<void> {
    if (this.enviando || !this.previa) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.respuestaError = 'Corrige los descuentos marcados: respeta el tope y escribe el motivo.';
      return;
    }
    const indices: number[] = [];
    const descuentos: DescuentoRq[] = this.previa.detalles.flatMap(({ itemRef }, i) => {
      const porcentaje = this.porcentaje(i);
      if (porcentaje <= 0) {
        return [];
      }
      indices.push(i);
      return [{ itemRef, porcentaje, motivo: this.renglones.at(i).controls.motivo.value.trim() }];
    });
    const { total } = this.totales;
    this.enviando = true;
    const { isConfirmed } = await Swal.fire({
      title: '¿Generar la factura?',
      text: `Total: ${new MonedaPipe().transform(total)}.${total === 0 ? ' Con descuento total nacerá pagada.' : ''} Los valores quedan fijos.`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'Generar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.enviando = false;
      return;
    }
    this.respuestaError = '';
    this.facturaService.generar({ citaId: this.citaId, observacion: this.form.controls.observacion.value.trim() || null, descuentos }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message, data }) => {
        this.modal.close(data);
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => {
        this.respuestaError = mensajeError(error, 'No fue posible generar la factura.');
        const detalles = error instanceof HttpErrorResponse ? (error.error as Partial<ErrorApi> | null)?.detalles : undefined;
        for (const { campo, mensaje } of Array.isArray(detalles) ? detalles : []) {
          const encontrado = /^descuentos\[(\d+)\]\.(porcentaje|motivo)$/.exec(campo);
          const indice = encontrado ? indices[Number(encontrado[1])] : undefined;
          if (encontrado && indice !== undefined) {
            const control = this.renglones.at(indice).controls[encontrado[2] as 'porcentaje' | 'motivo'];
            control.setErrors({ servidor: mensaje });
            control.markAsTouched();
          }
        }
      }
    });
  }
}
