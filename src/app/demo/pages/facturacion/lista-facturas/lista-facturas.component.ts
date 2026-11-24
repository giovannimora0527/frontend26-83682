import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EstadoFactura } from 'src/app/models/estados';
import { Factura } from 'src/app/models/factura';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { FacturaService, FiltroFacturas } from '../service/factura.service';
import { TablaFacturasComponent } from '../tabla-facturas/tabla-facturas.component';

@Component({
  selector: 'app-lista-facturas',
  imports: [FormsModule, FiltroFechasComponent, TablaFacturasComponent],
  template: `
    <app-filtro-fechas (cambio)="filtrarFechas($event)" />
    <select class="form-select mt-2" aria-label="Estado de la factura" [(ngModel)]="filtro.estado" (ngModelChange)="listar()">
      <option value="">Todos los estados</option>
      @for (estado of estados; track estado) {
        <option [value]="estado">{{ estadosUi[estado].etiqueta }}</option>
      }
    </select>
    @if (error) {
      <div class="alert alert-danger mt-2" role="alert">{{ error }} <button type="button" class="btn btn-link mb-0" (click)="listar()">Reintentar</button></div>
    } @else if (cargando && !facturas.length) {
      <p class="text-center mt-2" role="status"><span class="spinner-border spinner-border-sm"></span> Cargando facturas...</p>
    } @else {
      <app-tabla-facturas [facturas]="facturas" (cambio)="listar()" />
    }
  `
})
export class ListaFacturasComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly facturaService = inject(FacturaService);
  private consulta?: Subscription;

  readonly estados: EstadoFactura[] = ['PENDIENTE', 'PAGO_PARCIAL', 'PAGADA', 'ANULADA'];
  readonly estadosUi = ESTADOS_UI;
  filtro: FiltroFacturas = { desde: '', hasta: '', estado: '' };
  facturas: Factura[] = [];
  cargando = false;
  error = '';

  constructor() {
    this.listar();
  }

  filtrarFechas(rango: RangoFechas | null): void {
    if (rango) {
      this.filtro = { ...this.filtro, ...rango };
      this.listar();
    }
  }

  listar(): void {
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.consulta = this.facturaService.listar(this.filtro).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (facturas) => {
        this.facturas = facturas;
        this.cargando = false;
      },
      error: (error) => {
        this.error = mensajeError(error, 'No fue posible cargar las facturas.');
        this.cargando = false;
      }
    });
  }
}
