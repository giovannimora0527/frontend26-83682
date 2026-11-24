import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Factura } from 'src/app/models/factura';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { FacturaModalComponent } from '../factura-modal/factura-modal.component';

@Component({
  selector: 'app-tabla-facturas',
  imports: [FormsModule, BadgeEstadoComponent, BotonOrdenComponent, PaginacionComponent, FechaHoraPipe, MonedaPipe],
  templateUrl: './tabla-facturas.component.html'
})
export class TablaFacturasComponent {
  readonly facturas = input.required<Factura[]>();
  readonly cambio = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private modal?: NgbModalRef;

  readonly columnas = [
    { clave: 'numero', titulo: 'Número' }, { clave: 'fecha', titulo: 'Fecha' }, { clave: 'propietario', titulo: 'Propietario' }, { clave: 'mascota', titulo: 'Mascota' },
    { clave: 'total', titulo: 'Total' }, { clave: 'pagado', titulo: 'Pagado' }, { clave: 'saldo', titulo: 'Saldo' }, { clave: 'estado', titulo: 'Estado' }
  ];
  readonly tabla = new Tabla<Factura>(
    {
      numero: (f) => f.numero, fecha: (f) => f.fecha, propietario: (f) => `${f.clienteNombre} ${f.clienteDocumento}`, mascota: (f) => f.mascotaNombre, total: (f) => f.total,
      pagado: (f) => f.pagado, saldo: (f) => f.saldo, estado: (f) => ESTADOS_UI[f.estado].etiqueta
    },
    'fecha'
  );

  constructor() {
    this.tabla.direccion = 'desc';
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    effect(() => this.tabla.items = this.facturas());
  }

  ver(factura: Factura, pagando = false): void {
    this.modal = this.modalService.open(FacturaModalComponent, {
      size: 'xl', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'facturaTitulo'
    });
    this.modal.componentInstance.facturaId = factura.id;
    this.modal.componentInstance.pagando = pagando;
    this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cambio) => {
      if (cambio) {
        this.cambio.emit();
      }
    });
  }
}
