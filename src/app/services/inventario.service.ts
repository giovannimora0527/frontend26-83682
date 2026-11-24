import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  FichaInventario, ImportacionInventario, LoteInventario, MovimientoInventario,
  NuevoLote, NuevoMovimiento, ProductoInventario, ResumenImportacion
} from '../models/inventario';

/** Servicio de inventario: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class InventarioService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http = inject(HttpClient);
  /** Ruta del recurso en la API del backend. */
  private readonly api = environment.apiUrlAuth + '/inventario';

  /** Lista el dato de la sesión. */
  listar() { return this.http.get<FichaInventario[]>(this.api + '/productos'); }

  /**
   * Guarda el dato de la sesión.
   *
   * @param id identificador del registro.
   * @param producto producto.
   */
  guardar(id: number | null, producto: ProductoInventario) {
    return id == null
      ? this.http.post<FichaInventario>(this.api + '/productos', producto)
      : this.http.put<FichaInventario>(this.api + '/productos/' + id, producto);
  }

  /**
   * Lotes mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  lotes(id: number) { return this.http.get<LoteInventario[]>(this.api + '/productos/' + id + '/lotes'); }
  /**
   * Movimientos mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  movimientos(id: number) {
    return this.http.get<MovimientoInventario[]>(this.api + '/productos/' + id + '/movimientos');
  }

  /**
   * Registra lote mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param lote lote.
   * @returns observable con la respuesta del backend.
   */
  registrarLote(id: number, lote: NuevoLote) {
    return this.http.post(this.api + '/productos/' + id + '/lotes', lote);
  }

  /**
   * Registra movimiento mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param lote lote.
   * @param movimiento movimiento.
   * @returns observable con la respuesta del backend.
   */
  registrarMovimiento(id: number, lote: number, movimiento: NuevoMovimiento) {
    return this.http.post(this.api + '/productos/' + id + '/lotes/' + lote + '/movimientos', movimiento);
  }

  /**
   * Previsualiza inventario antes de confirmarlo mediante la API del backend.
   *
   * @param archivo archivo seleccionado.
   * @returns observable con la respuesta del backend.
   */
  previsualizar(archivo: File) {
    const datos = new FormData();
    datos.set('archivo', archivo);
    return this.http.post<ImportacionInventario>(this.api + '/importaciones', datos);
  }

  /**
   * Confirma inventario mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  confirmar(id: number) {
    return this.http.post<ImportacionInventario>(this.api + '/importaciones/' + id + '/confirmar', null);
  }

  /**
   * Consulta el historial mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  historial() { return this.http.get<ResumenImportacion[]>(this.api + '/importaciones'); }
  /**
   * Consulta el detalle.
   *
   * @param id identificador del registro.
   */
  detalle(id: number) { return this.http.get<ImportacionInventario>(this.api + '/importaciones/' + id); }
}
