import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { EstadoStock, TipoProducto } from 'src/app/models/estados';
import { AlertasInventario, Producto } from 'src/app/models/producto';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { TieneRolDirective } from 'src/app/shared/directives/tiene-rol.directive';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { tieneExistenciaVigente } from './inventario.util';
import { ProductoFormComponent } from './producto-form/producto-form.component';
import { InventarioService } from './service/inventario.service';

@Component({
  selector: 'app-inventario',
  imports: [
    DatePipe, FormsModule, RouterLink, BadgeEstadoComponent, BotonOrdenComponent, PaginacionComponent, TieneRolDirective, MonedaPipe
  ],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly inventarioService = inject(InventarioService);
  private modal?: NgbModalRef;
  private productos: Producto[] = [];

  readonly tarjetas: { clave: keyof AlertasInventario; estado: EstadoStock; titulo: string; icono: string }[] = [
    { clave: 'agotados', estado: 'AGOTADO', titulo: 'Agotados', icono: 'fa-circle-xmark' },
    { clave: 'bajoStock', estado: 'BAJO', titulo: 'Bajo stock', icono: 'fa-arrow-trend-down' },
    { clave: 'proximosVencer', estado: 'PROXIMO_VENCER', titulo: 'Próximos a vencer', icono: 'fa-hourglass-half' },
    { clave: 'vencidos', estado: 'VENCIDO', titulo: 'Vencidos', icono: 'fa-calendar-xmark' }
  ];
  readonly estados: EstadoStock[] = ['DISPONIBLE', 'AGOTADO', 'BAJO', 'PROXIMO_VENCER', 'VENCIDO'];
  readonly estadosUi = ESTADOS_UI;
  readonly columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'estado', titulo: 'Estado' },
    { clave: 'cantidad', titulo: 'Cantidad' },
    { clave: 'tipo', titulo: 'Tipo' },
    { clave: 'presentacion', titulo: 'Presentación' },
    { clave: 'stockMinimo', titulo: 'Stock mínimo' },
    { clave: 'precioCompra', titulo: 'Precio compra' },
    { clave: 'precioVenta', titulo: 'Precio venta' },
    { clave: 'vencimiento', titulo: 'Próx. vencimiento' },
    { clave: 'invima', titulo: 'Invima' }
  ];
  readonly tabla = new Tabla<Producto>(
    {
      codigo: (p) => p.codigo,
      nombre: (p) => p.nombre,
      tipo: (p) => (p.tipoProducto === 'MEDICAMENTO' ? 'Medicamento' : 'Insumo'),
      presentacion: (p) => p.presentacion,
      cantidad: (p) => p.cantidadDisponible,
      stockMinimo: (p) => p.stockMinimo,
      precioCompra: (p) => p.precioCompraUltimo ?? 0,
      precioVenta: (p) => p.precioVenta,
      vencimiento: (p) => p.proximoVencimiento,
      invima: (p) => p.registroInvima,
      estado: (p) => p.estadosStock.map((estado) => ESTADOS_UI[estado].etiqueta).join(' ')
    },
    'nombre'
  );

  alertas: AlertasInventario | null = null;
  cargando = false;
  errorListado = '';
  cambiandoEstado = false;
  tipo: TipoProducto | '' = '';
  estado: EstadoStock | '' = '';
  soloDisponibles = false;
  soloActivos = true;

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.recargar();
  }

  recargar(): void {
    this.cargando = true;
    this.errorListado = '';
    this.inventarioService.listarProductos().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (productos) => {
        this.productos = productos;
        this.aplicarFiltros();
      },
      error: (error) => this.errorListado = mensajeError(error, 'No fue posible cargar el inventario.')
    });
    this.inventarioService.obtenerAlertas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (alertas) => this.alertas = alertas,
      error: () => this.alertas = null
    });
  }

  get hayProductos(): boolean {
    return this.productos.length > 0;
  }

  aplicarFiltros(): void {
    const pagina = this.tabla.pagina;
    this.tabla.items = this.productos.filter((producto) =>
      (!this.tipo || producto.tipoProducto === this.tipo) &&
      (!this.estado || producto.estadosStock.includes(this.estado)) &&
      (!this.soloDisponibles || tieneExistenciaVigente(producto)) &&
      (!this.soloActivos || producto.activo));
    this.tabla.pagina = pagina;
  }

  /** Las alertas solo cuentan productos activos: se limpian los demás filtros para que coincidan. */
  filtrarPorAlerta(estado: EstadoStock): void {
    this.estado = this.estado === estado ? '' : estado;
    this.tipo = '';
    this.soloDisponibles = false;
    this.soloActivos = true;
    this.tabla.termino = '';
    this.aplicarFiltros();
  }

  abrirFormulario(producto: Producto | null): void {
    this.modal = this.modalService.open(ProductoFormComponent, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'productoTitulo'
    });
    this.modal.componentInstance.producto = producto;
    this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recargar());
  }

  async cambiarEstado(producto: Producto): Promise<void> {
    if (this.cambiandoEstado) {
      return;
    }
    const activo = !producto.activo;
    this.cambiandoEstado = true;
    const { isConfirmed } = await Swal.fire({
      title: activo ? '¿Activar producto?' : '¿Inactivar producto?',
      text: activo ? `${producto.nombre} volverá a estar disponible.` : `${producto.nombre} no se podrá formular ni recibir entradas.`,
      icon: 'warning', showCancelButton: true, confirmButtonText: activo ? 'Activar' : 'Inactivar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.cambiandoEstado = false;
      return;
    }
    this.inventarioService.cambiarEstado(producto.id, activo).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cambiandoEstado = false)
    ).subscribe({
      next: () => this.recargar(),
      error: (error) => void Swal.fire('No se pudo cambiar el estado', mensajeError(error, 'Intenta nuevamente.'), 'error')
    });
  }
}
