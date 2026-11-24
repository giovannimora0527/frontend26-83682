import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { distinctUntilChanged, map, OperatorFunction, Subscription } from 'rxjs';
import { InventarioService } from '../../inventario/service/inventario.service';
import { DespachoMedicamento } from 'src/app/models/despacho';
import { Producto } from 'src/app/models/producto';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { filtrar, Tabla } from 'src/app/shared/utils/tabla.util';
import { DespachoService } from '../service/despacho.service';

@Component({
  selector: 'app-historial-medicamento',
  imports: [FormsModule, NgbTypeahead, BadgeEstadoComponent, PaginacionComponent, FechaHoraPipe],
  templateUrl: './historial-medicamento.component.html'
})
export class HistorialMedicamentoComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly despachoService = inject(DespachoService);
  private readonly inventarioService = inject(InventarioService);
  private consulta?: Subscription;
  private productos: Producto[] = [];

  readonly tabla = new Tabla<DespachoMedicamento>({ fecha: (d) => d.fecha }, 'fecha');
  texto: Producto | string = '';
  seleccionado: Producto | null = null;
  errorProductos = '';
  cargando = false;
  error = '';

  readonly formato = (producto: Producto) => `${producto.codigo} - ${producto.nombre}`;
  readonly buscar: OperatorFunction<string, Producto[]> = (texto$) => texto$.pipe(
    distinctUntilChanged(),
    map((texto) => filtrar(this.productos, texto, (p) => [p.codigo, p.nombre]).slice(0, 10))
  );

  constructor() {
    this.tabla.direccion = 'desc';
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.errorProductos = '';
    this.inventarioService.listarProductos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (productos) => this.productos = productos,
      error: (error) => this.errorProductos = mensajeError(error, 'No fue posible cargar los medicamentos.')
    });
  }

  elegir(evento: NgbTypeaheadSelectItemEvent<Producto>): void {
    this.seleccionado = evento.item;
    this.listar();
  }

  listar(): void {
    if (!this.seleccionado) {
      return;
    }
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.consulta = this.despachoService.historialMedicamento(this.seleccionado.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (despachos) => {
        this.tabla.items = despachos;
        this.cargando = false;
      },
      error: (error) => {
        this.error = mensajeError(error, 'No fue posible cargar el historial del medicamento.');
        this.cargando = false;
      }
    });
  }
}
