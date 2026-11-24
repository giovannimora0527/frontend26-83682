import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { AjusteRq, Lote, Producto } from 'src/app/models/producto';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { textoObligatorio, validarEntero } from '../inventario.util';
import { InventarioService } from '../service/inventario.service';

@Component({
  selector: 'app-ajuste-form',
  imports: [ReactiveFormsModule],
  templateUrl: './ajuste-form.component.html'
})
export class AjusteFormComponent {
  @Input({ required: true }) producto!: Producto;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly inventarioService = inject(InventarioService);
  readonly modal = inject(NgbActiveModal);
  readonly esInvalido = esInvalido;
  readonly form = this.formBuilder.nonNullable.group({
    loteId: this.formBuilder.control<number | null>(null, Validators.required),
    tipo: this.formBuilder.nonNullable.control<AjusteRq['tipo'] | ''>('', Validators.required),
    cantidad: this.formBuilder.control<number | null>(null, [...validarEntero, Validators.min(1)]),
    motivo: ['', textoObligatorio(500)]
  });
  enviando = false;
  respuestaError = '';

  get lote(): Lote | undefined {
    return this.producto.lotes?.find(({ id }) => id === this.form.controls.loteId.value);
  }

  get superaDisponible(): boolean {
    const { tipo, cantidad } = this.form.getRawValue();
    return tipo === 'AJUSTE_NEGATIVO' && !!this.lote && Number(cantidad) > this.lote.cantidadDisponible;
  }

  guardar(): void {
    if (this.enviando) {
      return;
    }
    const { loteId, tipo, cantidad, motivo } = this.form.getRawValue();
    if (this.form.invalid || this.superaDisponible || loteId === null || tipo === '') {
      this.form.markAllAsTouched();
      return;
    }
    const solicitud = this.inventarioService.registrarAjuste(this.producto.id, {
      loteId, tipo, cantidad: Number(cantidad), motivo: motivo.trim()
    });
    this.enviando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message, data }) => {
        this.modal.close(data);
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.respuestaError = marcarErroresServidor(this.form, error)
        ? '' : mensajeError(error, 'No fue posible registrar el ajuste.')
    });
  }
}
