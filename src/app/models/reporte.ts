export type TipoColumna = 'texto' | 'numero' | 'moneda' | 'fecha' | 'fechaHora' | 'porcentaje';
export type ValorReporte = string | number | null;

export interface ColumnaReporte {
  clave: string;
  titulo: string;
  tipo: TipoColumna;
}

export interface Reporte {
  codigo: string;
  titulo: string;
  generadoEn: string;
  generadoPor: string;
  filtros: Record<string, ValorReporte>;
  columnas: ColumnaReporte[];
  filas: Record<string, ValorReporte>[];
  totales: Record<string, ValorReporte>;
}

export interface FiltroReporte {
  clave: string;
  obligatorio: boolean;
  opciones?: string[];
}

export interface ReporteCatalogo {
  codigo: string;
  titulo: string;
  grupo: string;
  filtros: FiltroReporte[];
}
