export interface ProductoInventario {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  presentacion: string | null;
  tipo: 'MEDICAMENTO' | 'PRODUCTO' | 'UTENSILIO';
  invima: string | null;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  fechaCompra: string;
  fechaIngreso: string;
  fechaProximoPedido: string | null;
  fechaVence: string | null;
  activo: boolean;
}

export interface FichaInventario {
  id: number;
  producto: ProductoInventario;
  existencia: number;
  disponible: number;
  vencido: boolean;
  proximoVencer: boolean;
  vencimientoLote: string | null;
}

export interface NuevoLote {
  numero: string;
  costo: number;
  fechaIngreso: string;
  fechaVence: string | null;
  cantidad: number;
  referencia: string | null;
}

export interface LoteInventario extends Omit<NuevoLote, 'referencia'> {
  id: number;
  vencido: boolean;
  proximoVencer: boolean;
  disponible: boolean;
}

export interface NuevoMovimiento {
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  motivo: string;
  referencia: string | null;
}

export interface MovimientoInventario extends NuevoMovimiento {
  id: number;
  lote: string;
  usuario: string;
  fecha: string;
  saldo: number;
}

export interface ResumenImportacion {
  id: number;
  usuarioId: number;
  archivo: string;
  fecha: string;
  fechaConfirmacion: string | null;
  importados: number;
  rechazados: number;
}

export interface ImportacionInventario {
  resumen: ResumenImportacion;
  filas: { numero: number; producto: ProductoInventario | null; errores: string[] }[];
}
