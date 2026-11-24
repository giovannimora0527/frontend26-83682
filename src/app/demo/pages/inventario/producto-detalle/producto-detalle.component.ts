import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, Type } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal, NgbModalRef, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { DespachoModalComponent } from '../../despacho/despacho-modal/despacho-modal.component';
import { SIN_FILTRO } from '../../despacho/despacho.util';
import { DespachoService } from '../../despacho/service/despacho.service';
import { AuthService } from '../../login/service/auth.service';
import { Lote, MovimientoInventario, Producto } from 'src/app/models/producto';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { TieneRolDirective } from 'src/app/shared/directives/tiene-rol.directive';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { AjusteFormComponent } from '../ajuste-form/ajuste-form.component';
import { esSalida, ETIQUETAS_MOVIMIENTO } from '../inventario.util';
import { LoteFormComponent } from '../lote-form/lote-form.component';
import { ProductoFormComponent } from '../producto-form/producto-form.component';
import { InventarioService } from '../service/inventario.service';

@Component({
  selector: 'app-producto-detalle',
  imports: [
    DatePipe, RouterLink, NgbNavModule, BadgeEstadoComponent, FiltroFechasComponent, PaginacionComponent, TieneRolDirective,
    FechaHoraPipe, MonedaPipe
  ],
  templateUrl: './producto-detalle.component.html'
})
export class ProductoDetalleComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly inventarioService = inject(InventarioService);
  private readonly despachoService = inject(DespachoService);
  private modal?: NgbModalRef;
  private consultaMovimientos?: Subscription;
  private id = 0;
  private rango: RangoFechas = { desde: '', hasta: '' };

  readonly puedeVerCargas = inject(AuthService).tieneMenu('carga-inventario');
  readonly etiquetas = ETIQUETAS_MOVIMIENTO;
  readonly esSalida = esSalida;
  /** El backend entrega lo más reciente primero y ese es el orden del kardex. */
  readonly kardex = new Tabla<MovimientoInventario>({ id: (movimiento) => -movimiento.id }, 'id');

  pestana = 'lotes';
  producto: Producto | null = null;
  cargando = false;
  error = '';
  cargandoMovimientos = false;
  errorMovimientos = '';
  abriendoDespacho = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.id = Number(params.get('id'));
      this.producto = null;
      if (!Number.isInteger(this.id) || this.id <= 0) {
        this.error = 'El producto no existe.';
        return;
      }
      this.cargar();
      this.cargarMovimientos();
    });
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.inventarioService.obtenerProducto(this.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (producto) => this.producto = producto,
      error: (error) => this.error = mensajeError(error, 'No fue posible cargar el producto.')
    });
  }

  filtrarMovimientos(rango: RangoFechas | null): void {
    if (rango) {
      this.rango = rango;
      this.cargarMovimientos();
    }
  }

  cargarMovimientos(): void {
    this.consultaMovimientos?.unsubscribe();
    this.cargandoMovimientos = true;
    this.errorMovimientos = '';
    this.consultaMovimientos = this.inventarioService.listarMovimientos(this.id, this.rango.desde, this.rango.hasta).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (movimientos) => {
        this.kardex.items = movimientos;
        this.cargandoMovimientos = false;
      },
      error: (error) => {
        this.errorMovimientos = mensajeError(error, 'No fue posible cargar los movimientos.');
        this.cargandoMovimientos = false;
      }
    });
  }

  estadoLote(lote: Lote): string {
    if (lote.cantidadDisponible === 0) {
      return 'AGOTADO';
    }
    if (lote.vencido) {
      return 'VENCIDO';
    }
    return lote.diasParaVencer !== null && lote.diasParaVencer <= 30 ? 'PROXIMO_VENCER' : 'DISPONIBLE';
  }

  editar(): void {
    this.abrir(ProductoFormComponent, 'productoTitulo');
  }

  registrarEntrada(): void {
    this.abrir(LoteFormComponent, 'loteTitulo');
  }

  ajustar(): void {
    this.abrir(AjusteFormComponent, 'ajusteTitulo');
  }

  /** El API no expone un despacho por id: se busca por su número en el historial. */
  verDespacho(movimiento: MovimientoInventario): void {
    if (this.abriendoDespacho) {
      return;
    }
    this.abriendoDespacho = true;
    const texto = (movimiento.referencia ?? '').split(' / ')[0];
    this.despachoService.historial({ ...SIN_FILTRO, texto }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.abriendoDespacho = false)
    ).subscribe({
      next: (despachos) => {
        const despacho = despachos.find(({ id }) => id === movimiento.despachoId);
        if (!despacho) {
          void Swal.fire('Despacho no encontrado', 'No fue posible encontrar el despacho.', 'error');
          return;
        }
        this.modal = this.modalService.open(DespachoModalComponent, { size: 'lg', scrollable: true, ariaLabelledBy: 'despachoTitulo' });
        this.modal.componentInstance.despacho = despacho;
        this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cambio) => {
          if (cambio) {
            this.cargar();
            this.cargarMovimientos();
          }
        });
      },
      error: (error) => void Swal.fire('No se pudo abrir el despacho', mensajeError(error, 'Intenta nuevamente.'), 'error')
    });
  }

  private abrir(componente: Type<unknown>, titulo: string): void {
    this.modal = this.modalService.open(componente, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: titulo
    });
    this.modal.componentInstance.producto = this.producto;
    this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cargar();
      this.cargarMovimientos();
    });
  }
}
