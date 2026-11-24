import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { Despacho } from 'src/app/models/despacho';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { TieneRolDirective } from 'src/app/shared/directives/tiene-rol.directive';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { ESTADOS_PENDIENTES } from '../despacho.util';
import { DespachoService } from '../service/despacho.service';

/** Detalle de un despacho. El ADMINISTRADOR puede revertirlo o cancelar lo pendiente. Se cierra con true si hubo cambios. */
@Component({
  selector: 'app-despacho-modal',
  imports: [DatePipe, BadgeEstadoComponent, BotonDescargaComponent, TieneRolDirective, FechaHoraPipe],
  templateUrl: './despacho-modal.component.html'
})
export class DespachoModalComponent {
  @Input({ required: true }) despacho!: Despacho;

  private readonly destroyRef = inject(DestroyRef);
  private readonly despachoService = inject(DespachoService);
  readonly modal = inject(NgbActiveModal);
  procesando = false;

  get tieneComprobante(): boolean {
    return ['CONFIRMADO', 'REVERTIDO'].includes(this.despacho.estado);
  }

  get facturado(): boolean {
    return this.despacho.items.some(({ facturado }) => facturado);
  }

  get reversible(): boolean {
    return this.despacho.estado === 'CONFIRMADO' && this.despacho.items.length > 0 && !this.facturado;
  }

  get cancelable(): boolean {
    return ESTADOS_PENDIENTES.includes(this.despacho.estadoDespacho);
  }

  async revertir(): Promise<void> {
    const motivo = await this.pedirMotivo('¿Revertir el despacho?',
      'Las cantidades vuelven a los mismos lotes y queda registrado en el kardex. No se borra nada. Si la fórmula está cancelada, no se reabre.', 'Revertir');
    if (motivo) {
      this.enviar(this.despachoService.revertir(this.despacho.id, motivo));
    }
  }

  async cancelarPendiente(): Promise<void> {
    const motivo = await this.pedirMotivo('¿Cancelar el despacho de la fórmula?',
      'Lo que falta por entregar ya no se podrá despachar. Lo entregado no cambia.', 'Cancelar despacho');
    if (motivo) {
      this.enviar(this.despachoService.cancelar(this.despacho.formulaId, motivo));
    }
  }

  private async pedirMotivo(title: string, text: string, confirmButtonText: string): Promise<string | null> {
    if (this.procesando) {
      return null;
    }
    this.procesando = true;
    const { isConfirmed, value } = await Swal.fire({
      title, text, icon: 'warning', input: 'textarea', inputLabel: 'Motivo', inputAttributes: { maxlength: '255' },
      inputValidator: (motivo) => (motivo.trim() ? null : 'Escribe el motivo.'), showCancelButton: true, confirmButtonText, cancelButtonText: 'Volver'
    });
    this.procesando = false;
    return isConfirmed ? String(value).trim() : null;
  }

  private enviar(solicitud: Observable<{ message: string }>): void {
    this.procesando = true;
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: ({ message }) => {
        this.modal.close(true);
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error) => void Swal.fire('No se pudo completar', mensajeError(error, 'Intenta nuevamente.'), 'error')
    });
  }
}
