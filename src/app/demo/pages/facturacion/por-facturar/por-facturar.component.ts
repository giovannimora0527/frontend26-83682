import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { CitaPorFacturar, Factura } from 'src/app/models/factura';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { GenerarFacturaComponent } from '../generar-factura/generar-factura.component';
import { FacturaService } from '../service/factura.service';

@Component({
  selector: 'app-por-facturar',
  imports: [FormsModule, BotonDescargaComponent, PaginacionComponent, BadgeEstadoComponent, FechaHoraPipe, MonedaPipe],
  templateUrl: './por-facturar.component.html'
})
export class PorFacturarComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly facturaService = inject(FacturaService);
  private modal?: NgbModalRef;

  readonly tabla = new Tabla<CitaPorFacturar>(
    { fecha: (c) => c.fecha, propietario: (c) => `${c.clienteNombre} ${c.clienteDocumento}`, mascota: (c) => c.mascotaNombre, medico: (c) => c.medicoNombre, motivo: (c) => c.motivo },
    'fecha'
  );
  cargando = false;
  error = '';
  generada: Factura | null = null;

  constructor() {
    this.tabla.direccion = 'desc';
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.error = '';
    this.facturaService.listarPendientes().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (citas) => this.tabla.items = citas,
      error: (error) => this.error = mensajeError(error, 'No fue posible cargar las citas por facturar.')
    });
  }

  generar(cita: CitaPorFacturar): void {
    this.generada = null;
    this.modal = this.modalService.open(GenerarFacturaComponent, {
      size: 'xl', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'generarTitulo'
    });
    this.modal.componentInstance.citaId = cita.citaId;
    this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((factura?: Factura) => {
      this.generada = factura ?? null;
      this.listar();
    });
  }
}
