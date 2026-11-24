import { AccionCarga, EstadoCarga } from './estados';
import { DetalleError } from './respuesta';

export interface FilaCarga {
  fila: number;
  valida: boolean;
  accion: AccionCarga | null;
  datos: Record<string, string | number | boolean | null>;
  errores: DetalleError[];
}

export interface CargaInventario {
  cargaId: number;
  nombreArchivo: string;
  estado: EstadoCarga;
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
  filasImportadas: number;
  usuario: string;
  fecha: string;
  filas?: FilaCarga[];
}
