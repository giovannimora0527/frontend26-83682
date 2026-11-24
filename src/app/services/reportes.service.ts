import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/** Tipo «CeldaReporte»: valores permitidos para celda reporte. */
export type CeldaReporte = string | number | null;
/** Modelo de datos «ColumnaReporte» que se intercambia con el backend. */
export interface ColumnaReporte {
  /** Clave del dato. */
  clave:string;
  /** Título. */
  titulo:string;
  /** Formato de presentación. */
  formato:'TEXTO'|'ENTERO'|'COP'|'FECHA'|'FECHAHORA';
}
/** Modelo de datos «ResultadoReporte» que se intercambia con el backend. */
export interface ResultadoReporte {
  /** Título. */
  titulo:string;
  /** Generado. */
  generado:string;
  /** Criterio de filtrado: filtros. */
  filtros:Record<string,string>;
  /** Columnas del resultado. */
  columnas:ColumnaReporte[];
  /** Totales calculados. */
  totales:Record<string,CeldaReporte>;
  /** Filas del resultado. */
  filas:Record<string,CeldaReporte>[];
  /** Registros. */
  registros:number;
  /** Página actual (desde 0). */
  pagina:number;
}

/** Servicio de reportes: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({providedIn:'root'})
export class ReportesService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http=inject(HttpClient);
  /** URL base de la API del backend. */
  private readonly base=environment.apiUrlAuth+'/reportes';

  /**
   * Consulta reportes mediante la API del backend.
   *
   * @param tipo tipo seleccionado.
   * @param params parámetros de consulta.
   * @returns observable con la respuesta del backend.
   */
  consultar(tipo:string,params:Record<string,string|number>) {
    return this.http.get<ResultadoReporte>(this.base+'/'+tipo,{params});
  }

  /**
   * Descarga reportes como archivo mediante la API del backend.
   *
   * @param tipo tipo seleccionado.
   * @param formato formato.
   * @param params parámetros de consulta.
   * @returns observable con la respuesta del backend.
   */
  descargar(tipo:string,formato:'pdf'|'excel',params:Record<string,string>) {
    return this.http.get(this.base+'/'+tipo+'/'+formato,{params,responseType:'blob'});
  }
}
