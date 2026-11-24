import { EstadoFactura, MedioPago } from './estados';

export interface FacturaDetalle {
  itemRef: string;
  tipoItem: 'SERVICIO' | 'MEDICAMENTO';
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  porcentajeDescuento: number;
  valorDescuento: number;
  motivoDescuento: string | null;
  porcentajeIva: number;
  valorIva: number;
  total: number;
}

export interface TotalesFactura {
  subtotal: number;
  descuentos: number;
  iva: number;
  total: number;
}

export interface CitaPorFacturar {
  citaId: number;
  fecha: string;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;
  mascotaId: number;
  mascotaNombre: string;
  medicoNombre: string;
  motivo: string;
  despachoPendiente: boolean;
}

export interface FacturaPrevia extends TotalesFactura {
  citaId: number;
  fechaCita: string;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;
  mascotaId: number;
  mascotaNombre: string;
  medicoNombre: string;
  especialidadNombre: string;
  detalles: FacturaDetalle[];
  /** Porcentaje máximo del usuario que consulta. */
  topeDescuento: number;
  advertencias: string[];
}

export interface DescuentoRq {
  itemRef: string;
  porcentaje: number;
  motivo: string;
}

export interface FacturaGenerarRq {
  citaId: number;
  observacion: string | null;
  descuentos: DescuentoRq[];
}

export interface PagoRq {
  valor: number;
  medioPago: MedioPago;
  referencia: string | null;
}

export interface Pago extends PagoRq {
  id: number;
  fecha: string;
  usuario: string;
  anulado: boolean;
}

export interface Factura extends TotalesFactura {
  id: number;
  numero: string;
  fecha: string;
  citaId: number;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;
  mascotaId: number;
  mascotaNombre: string;
  medicoNombre: string;
  especialidadNombre: string;
  pagado: number;
  saldo: number;
  estado: EstadoFactura;
  observacion: string | null;
  usuario?: string;
  fechaAnulacion?: string | null;
  usuarioAnulacion?: string | null;
  motivoAnulacion?: string | null;
  /** Solo vienen al consultar una factura. */
  detalles?: FacturaDetalle[];
  pagos?: Pago[];
}

export interface HistorialFactura {
  id: number;
  estadoAnterior: EstadoFactura | null;
  estadoNuevo: EstadoFactura;
  motivo: string | null;
  usuario: string;
  fecha: string;
}
