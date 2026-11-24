import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { distinctUntilChanged, forkJoin, map, OperatorFunction, Subscription } from 'rxjs';
import { ClienteService } from '../../cliente/service/cliente.service';
import { MascotaService } from '../../mascota/service/mascota.service';
import { Factura, TotalesFactura } from 'src/app/models/factura';
import { MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { filtrar } from 'src/app/shared/utils/tabla.util';
import { FacturaService } from '../service/factura.service';
import { TablaFacturasComponent } from '../tabla-facturas/tabla-facturas.component';

interface Opcion {
  tipo: 'cliente' | 'mascota';
  id: number;
  texto: string;
}

@Component({
  selector: 'app-historial-facturas',
  imports: [FormsModule, NgbTypeahead, TablaFacturasComponent, MonedaPipe],
  template: `
    @if (errorOpciones) {
      <div class="alert alert-danger" role="alert">{{ errorOpciones }} <button type="button" class="btn btn-link mb-0" (click)="cargarOpciones()">Reintentar</button></div>
    }
    <label for="factura-buscar" class="form-label">Propietario o mascota</label>
    <input id="factura-buscar" type="text" class="form-control mb-2" autocomplete="off" placeholder="Escribe el nombre o el documento" [(ngModel)]="texto"
      [ngbTypeahead]="buscar" [inputFormatter]="formato" [resultFormatter]="formato" (selectItem)="elegir($event)" />
    @if (error) {
      <div class="alert alert-danger" role="alert">{{ error }} <button type="button" class="btn btn-link mb-0" (click)="listar()">Reintentar</button></div>
    } @else if (elegida) {
      <p class="mb-0">Facturado: <strong>{{ totales.total | moneda }}</strong>. Pagado: <strong>{{ totales.pagado | moneda }}</strong>. Saldo: <strong>{{ totales.saldo | moneda }}</strong> (sin anuladas)</p>
      <app-tabla-facturas [facturas]="facturas" (cambio)="listar()" />
    } @else {
      <p class="text-muted">Elige un propietario o una mascota para ver sus facturas.</p>
    }
  `
})
export class HistorialFacturasComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly facturaService = inject(FacturaService);
  private readonly clienteService = inject(ClienteService);
  private readonly mascotaService = inject(MascotaService);
  private consulta?: Subscription;
  private opciones: Opcion[] = [];

  texto: Opcion | string = '';
  elegida: Opcion | null = null;
  facturas: Factura[] = [];
  errorOpciones = '';
  error = '';

  readonly formato = (opcion: Opcion) => opcion.texto;
  readonly buscar: OperatorFunction<string, Opcion[]> = (texto$) => texto$.pipe(
    distinctUntilChanged(),
    map((texto) => filtrar(this.opciones, texto, (opcion) => [opcion.texto]).slice(0, 10))
  );

  constructor() {
    this.cargarOpciones();
  }

  cargarOpciones(): void {
    this.errorOpciones = '';
    forkJoin({ clientes: this.clienteService.listarClientes(), mascotas: this.mascotaService.listarMascotas() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ clientes, mascotas }) => this.opciones = [
        ...clientes.flatMap((c): Opcion[] => c.id === undefined ? [] : [{ tipo: 'cliente', id: c.id, texto: `Propietario: ${c.nombres} ${c.apellidos} (${c.numeroDocumento})` }]),
        ...mascotas.flatMap((m): Opcion[] => m.mascotaId === undefined ? [] : [{
          tipo: 'mascota', id: m.mascotaId, texto: `Mascota: ${m.nombreMascota ?? m.nombre} (${m.cliente?.nombres ?? ''} ${m.cliente?.apellidos ?? ''})`
        }])
      ],
      error: (error) => this.errorOpciones = mensajeError(error, 'No fue posible cargar propietarios y mascotas.')
    });
  }

  elegir(evento: NgbTypeaheadSelectItemEvent<Opcion>): void {
    this.elegida = evento.item;
    this.facturas = [];
    this.listar();
  }

  listar(): void {
    if (!this.elegida) {
      return;
    }
    this.consulta?.unsubscribe();
    this.error = '';
    const { tipo, id } = this.elegida;
    this.consulta = (tipo === 'cliente' ? this.facturaService.listarPorCliente(id) : this.facturaService.listarPorMascota(id)).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (facturas) => this.facturas = facturas,
      error: (error) => this.error = mensajeError(error, 'No fue posible cargar las facturas.')
    });
  }

  get totales(): Pick<TotalesFactura, 'total'> & { pagado: number; saldo: number } {
    const vigentes = this.facturas.filter(({ estado }) => estado !== 'ANULADA');
    const sumar = (campo: 'total' | 'pagado' | 'saldo') => vigentes.reduce((suma, factura) => suma + factura[campo], 0);
    return { total: sumar('total'), pagado: sumar('pagado'), saldo: sumar('saldo') };
  }
}
