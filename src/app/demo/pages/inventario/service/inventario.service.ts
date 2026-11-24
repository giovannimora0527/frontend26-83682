import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { AjusteRq, AlertasInventario, LoteRq, MovimientoInventario, Producto, ProductoRq } from 'src/app/models/producto';
import { RespuestaApi } from 'src/app/models/respuesta';
import { Impuesto } from 'src/app/models/tarifa';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

type RespuestaProducto = Observable<RespuestaApi<Producto>>;

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private api = 'inventario';

  constructor(private readonly backendService: BackendService) { }

  listarProductos(): Observable<Producto[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'productos');
  }

  obtenerProducto(id: number): Observable<Producto> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `productos/${id}`);
  }

  crearProducto(producto: ProductoRq): RespuestaProducto {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'productos', producto);
  }

  actualizarProducto(id: number, producto: ProductoRq): RespuestaProducto {
    return this.backendService.put(environment.apiUrlAuth, this.api, `productos/${id}`, producto);
  }

  cambiarEstado(id: number, activo: boolean): RespuestaProducto {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `productos/${id}/estado`, { activo });
  }

  registrarEntrada(id: number, lote: LoteRq): RespuestaProducto {
    return this.backendService.post(environment.apiUrlAuth, this.api, `productos/${id}/lotes`, lote);
  }

  registrarAjuste(id: number, ajuste: AjusteRq): RespuestaProducto {
    return this.backendService.post(environment.apiUrlAuth, this.api, `productos/${id}/ajustes`, ajuste);
  }

  listarMovimientos(id: number, desde: string, hasta: string): Observable<MovimientoInventario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `productos/${id}/movimientos`, construirParams({ desde, hasta }));
  }

  obtenerAlertas(): Observable<AlertasInventario> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'alertas');
  }

  /**
   * Impuestos activos. Mientras el backend no exponga /impuesto/listar, se usan los que ya
   * tienen los productos del inventario.
   */
  listarImpuestos(): Observable<Impuesto[]> {
    return this.backendService.get<Impuesto[]>(environment.apiUrlAuth, 'impuesto', 'listar').pipe(
      map((impuestos) => impuestos.filter(({ activo }) => activo !== false)),
      catchError(() => this.impuestosDeProductos())
    );
  }

  private impuestosDeProductos(): Observable<Impuesto[]> {
    return this.listarProductos().pipe(
      map((productos) => {
        const impuestos = new Map<number, Impuesto>();
        for (const { impuestoId, porcentajeIva } of productos) {
          if (impuestoId !== null) {
            impuestos.set(impuestoId, { id: impuestoId, nombre: `IVA ${porcentajeIva} %`, porcentaje: porcentajeIva });
          }
        }
        return [...impuestos.values()].sort((a, b) => a.porcentaje - b.porcentaje);
      }),
      catchError(() => of([]))
    );
  }
}
