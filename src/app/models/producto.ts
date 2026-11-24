import { EstadoStock, TipoMovimiento, TipoProducto } from './estados';

export interface Lote {
  id: number;
  numeroLote: string;
  precioCompra: number;
  cantidadInicial: number;
  cantidadDisponible: number;
  fechaCompra: string;
  fechaIngreso: string;
  fechaVencimiento: string | null;
  vencido: boolean;
  diasParaVencer: number | null;
}

export interface LoteRq {
  numeroLote: string;
  precioCompra: number;
  cantidad: number;
  fechaCompra: string;
  fechaIngreso: string;
  fechaVencimiento: string | null;
}

interface DatosProducto {
  codigo: string;
  nombre: string;
  tipoProducto: TipoProducto;
  descripcion: string | null;
  presentacion: string | null;
  unidadMedida: string;
  registroInvima: string | null;
  precioVenta: number;
  porcentajeIva: number;
  stockMinimo: number;
  fechaProximoPedido: string | null;
}

export interface Producto extends DatosProducto {
  id: number;
  requiereInvima: boolean;
  activo: boolean;
  cantidadDisponible: number;
  precioCompraUltimo: number | null;
  precioCompraPromedio: number | null;
  proximoVencimiento: string | null;
  estadosStock: EstadoStock[];
  lotes?: Lote[];
}

export interface ProductoRq extends DatosProducto {
  loteInicial?: LoteRq;
}

export interface AjusteRq {
  loteId: number;
  tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
  cantidad: number;
  motivo: string;
}

export interface MovimientoInventario {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  medicamentoId: number;
  medicamentoNombre?: string;
  loteId: number;
  numeroLote: string;
  cantidad: number;
  saldo: number;
  usuario: string;
  motivo?: string | null;
  referencia?: string | null;
}

export interface AlertasInventario {
  agotados: number;
  bajoStock: number;
  proximosVencer: number;
  vencidos: number;
}
