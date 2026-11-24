import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Producto } from 'src/app/models/producto';
import { marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { CamposLoteComponent } from '../campos-lote/campos-lote.component';
import { crearFormularioLote, datosLote } from '../inventario.util';
import { InventarioService } from '../service/inventario.service';

@Component({
  selector: 'app-lote-form',
  imports: [ReactiveFormsModule, CamposLoteComponent],
  templateUrl: './lote-form.component.html'
})
export class LoteFormComponent {
  @Input({ required: true }) producto!: Producto;

  private readonly destroyRef = inject(DestroyRef);
  private readonly inventarioService = inject(InventarioService);
  readonly modal = inject(NgbActiveModal);
  readonly form = crearFormularioLote(inject(FormBuilder), () => this.esMedicamento);
  enviando = false;
  respuestaError = '';

  get esMedicamento(): boolean {
    return this.producto?.tipoProducto === 'MEDICAMENTO';
  }

  guardar(): void {
    if (this.enviando) {
      return;
    }
    // El producto llega después de crear el formulario: se revalida con su tipo.
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const solicitud = this.inventarioService.registrarEntrada(this.producto.id, datosLote(this.form));
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
        ? '' : mensajeError(error, 'No fue posible registrar la entrada.')
    });
  }
}
