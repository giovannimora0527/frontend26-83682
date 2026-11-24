import { EstadoFactura, MedioPago } from './estados';

export interface FacturaDetalle {
  itemRef: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  porcentajeDescuento: number;
  valorDescuento: number;
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

export interface FacturaPrevia extends TotalesFactura {
  citaId: number;
  clienteNombre: string;
  mascotaNombre: string;
  medicoNombre: string;
  detalles: FacturaDetalle[];
  advertencias?: string[];
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
  detalles?: FacturaDetalle[];
  pagos?: Pago[];
}
