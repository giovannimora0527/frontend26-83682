import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  FichaInventario, ImportacionInventario, LoteInventario, MovimientoInventario,
  NuevoLote, NuevoMovimiento, ProductoInventario, ResumenImportacion
} from '../models/inventario';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrlAuth + '/inventario';

  listar() { return this.http.get<FichaInventario[]>(this.api + '/productos'); }

  guardar(id: number | null, producto: ProductoInventario) {
    return id == null
      ? this.http.post<FichaInventario>(this.api + '/productos', producto)
      : this.http.put<FichaInventario>(this.api + '/productos/' + id, producto);
  }

  lotes(id: number) { return this.http.get<LoteInventario[]>(this.api + '/productos/' + id + '/lotes'); }
  movimientos(id: number) {
    return this.http.get<MovimientoInventario[]>(this.api + '/productos/' + id + '/movimientos');
  }

  registrarLote(id: number, lote: NuevoLote) {
    return this.http.post(this.api + '/productos/' + id + '/lotes', lote);
  }

  registrarMovimiento(id: number, lote: number, movimiento: NuevoMovimiento) {
    return this.http.post(this.api + '/productos/' + id + '/lotes/' + lote + '/movimientos', movimiento);
  }

  previsualizar(archivo: File) {
    const datos = new FormData();
    datos.set('archivo', archivo);
    return this.http.post<ImportacionInventario>(this.api + '/importaciones', datos);
  }

  confirmar(id: number) {
    return this.http.post<ImportacionInventario>(this.api + '/importaciones/' + id + '/confirmar', null);
  }

  historial() { return this.http.get<ResumenImportacion[]>(this.api + '/importaciones'); }
  detalle(id: number) { return this.http.get<ImportacionInventario>(this.api + '/importaciones/' + id); }
}
