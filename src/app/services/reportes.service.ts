import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type CeldaReporte = string | number | null;
export interface ColumnaReporte {
  clave:string;
  titulo:string;
  formato:'TEXTO'|'ENTERO'|'COP'|'FECHA'|'FECHAHORA';
}
export interface ResultadoReporte {
  titulo:string;
  generado:string;
  filtros:Record<string,string>;
  columnas:ColumnaReporte[];
  totales:Record<string,CeldaReporte>;
  filas:Record<string,CeldaReporte>[];
  registros:number;
  pagina:number;
}

@Injectable({providedIn:'root'})
export class ReportesService {
  private readonly http=inject(HttpClient);
  private readonly base=environment.apiUrlAuth+'/reportes';

  consultar(tipo:string,params:Record<string,string|number>) {
    return this.http.get<ResultadoReporte>(this.base+'/'+tipo,{params});
  }

  descargar(tipo:string,formato:'pdf'|'excel',params:Record<string,string>) {
    return this.http.get(this.base+'/'+tipo+'/'+formato,{params,responseType:'blob'});
  }
}
