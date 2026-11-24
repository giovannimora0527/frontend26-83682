/** Modelo de datos «ProductoInventario» que se intercambia con el backend. */
export interface ProductoInventario {
  /** Código del registro. */
  codigo: string;
  /** Nombre. */
  nombre: string;
  /** Descripción. */
  descripcion: string | null;
  /** Presentación. */
  presentacion: string | null;
  /** Tipo de registro. */
  tipo: 'MEDICAMENTO' | 'PRODUCTO' | 'UTENSILIO';
  /** INVIMA. */
  invima: string | null;
  /** Precio compra. */
  precioCompra: number;
  /** Precio venta. */
  precioVenta: number;
  /** Stock mínimo. */
  stockMinimo: number;
  /** Fecha compra. */
  fechaCompra: string;
  /** Fecha ingreso. */
  fechaIngreso: string;
  /** Fecha próximo pedido. */
  fechaProximoPedido: string | null;
  /** Fecha vence. */
  fechaVence: string | null;
  /** Indica si el registro está activo. */
  activo: boolean;
}

/** Modelo de datos «FichaInventario» que se intercambia con el backend. */
export interface FichaInventario {
  /** Identificador único del registro. */
  id: number;
  /** Producto. */
  producto: ProductoInventario;
  /** Existencia. */
  existencia: number;
  /** Indica si disponible. */
  disponible: number;
  /** Indica si vencido. */
  vencido: boolean;
  /** Indica si próximo vencer. */
  proximoVencer: boolean;
  /** Vencimiento lote. */
  vencimientoLote: string | null;
}

/** Modelo de datos «NuevoLote» que se intercambia con el backend. */
export interface NuevoLote {
  /** Número. */
  numero: string;
  /** Costo. */
  costo: number;
  /** Fecha ingreso. */
  fechaIngreso: string;
  /** Fecha vence. */
  fechaVence: string | null;
  /** Cantidad. */
  cantidad: number;
  /** Referencia. */
  referencia: string | null;
}

/** Modelo de datos «LoteInventario» que se intercambia con el backend. */
export interface LoteInventario extends Omit<NuevoLote, 'referencia'> {
  /** Identificador único del registro. */
  id: number;
  /** Indica si vencido. */
  vencido: boolean;
  /** Indica si próximo vencer. */
  proximoVencer: boolean;
  /** Indica si disponible. */
  disponible: boolean;
}

/** Modelo de datos «NuevoMovimiento» que se intercambia con el backend. */
export interface NuevoMovimiento {
  /** Tipo de registro. */
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  /** Cantidad. */
  cantidad: number;
  /** Motivo registrado. */
  motivo: string;
  /** Referencia. */
  referencia: string | null;
}

/** Modelo de datos «MovimientoInventario» que se intercambia con el backend. */
export interface MovimientoInventario extends NuevoMovimiento {
  /** Identificador único del registro. */
  id: number;
  /** Número de lote. */
  lote: string;
  /** Usuario. */
  usuario: string;
  /** Fecha (AAAA-MM-DD). */
  fecha: string;
  /** Saldo pendiente por pagar. */
  saldo: number;
}

/** Modelo de datos «ResumenImportacion» que se intercambia con el backend. */
export interface ResumenImportacion {
  /** Identificador único del registro. */
  id: number;
  /** Identificador de usuario. */
  usuarioId: number;
  /** Archivo. */
  archivo: string;
  /** Fecha (AAAA-MM-DD). */
  fecha: string;
  /** Fecha confirmación. */
  fechaConfirmacion: string | null;
  /** Importados. */
  importados: number;
  /** Rechazados. */
  rechazados: number;
}

/** Modelo de datos «ImportacionInventario» que se intercambia con el backend. */
export interface ImportacionInventario {
  /** Resumen. */
  resumen: ResumenImportacion;
  /** Filas del resultado. */
  filas: { numero: number; producto: ProductoInventario | null; errores: string[] }[];
}
