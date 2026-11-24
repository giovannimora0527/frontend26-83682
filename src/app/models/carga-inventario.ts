import { AccionCarga, EstadoCarga } from './estados';
import { DetalleError } from './respuesta';

export interface FilaCarga {
  fila: number;
  valida: boolean;
  accion: AccionCarga | null;
  datos: Record<string, string | null>;
  errores: DetalleError[];
  advertencias: DetalleError[];
  importada: boolean;
  errorImportacion: string | null;
}

export interface CargaInventario {
  cargaId: number;
  nombreArchivo: string;
  formato: string;
  estado: EstadoCarga;
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
  filasImportadas: number;
  usuario: string;
  fecha: string;
  usuarioConfirmacion: string | null;
  fechaConfirmacion: string | null;
  filas?: FilaCarga[];
}
