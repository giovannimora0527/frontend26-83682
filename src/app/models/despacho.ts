import { EstadoDespacho, ViaAdministracion } from './estados';

export interface FormulaPendiente {
  formulaId: number;
  numero: string;
  fecha: string;
  medicoNombre: string;
  clienteNombre: string;
  mascotaNombre: string;
  totalMedicamentos: number;
  estadoDespacho: EstadoDespacho;
}

export interface DespachoLote {
  loteId: number;
  numeroLote: string;
  fechaVencimiento: string | null;
  cantidadDisponible: number;
  vencido: boolean;
  proximoVencer: boolean;
  cantidadSugerida: number;
}

export interface DespachoDetalle {
  formulaDetalleId: number;
  medicamentoId: number;
  codigo: string;
  nombre: string;
  dosis: number;
  unidadDosis: string;
  frecuenciaHoras: number;
  duracionDias: number;
  viaAdministracion: ViaAdministracion;
  indicaciones: string | null;
  cantidadPrescrita: number;
  cantidadDespachada: number;
  cantidadPendiente: number;
  existenciaTotalVigente: number;
  puedeEntregarse: boolean;
  lotes: DespachoLote[];
}

export interface DespachoFormula {
  formulaId: number;
  despachoId?: number | null;
  numero: string;
  fecha: string;
  medicoNombre: string;
  clienteNombre: string;
  mascotaNombre: string;
  indicacionesGenerales: string | null;
  estadoDespacho: EstadoDespacho;
  detalles: DespachoDetalle[];
}

export interface DespachoItemRq {
  formulaDetalleId: number;
  loteId: number;
  cantidad: number;
}

export interface DespachoConfirmarRq {
  observacion: string | null;
  items: DespachoItemRq[];
}

export interface DespachoItem extends DespachoItemRq {
  medicamentoNombre: string;
  numeroLote: string;
}

export interface Despacho {
  id: number;
  numero: string;
  formulaId: number;
  formulaNumero: string;
  fecha: string;
  mascotaNombre: string;
  clienteNombre: string;
  medicoNombre: string;
  usuario: string;
  estadoDespacho: EstadoDespacho;
  observacion: string | null;
  revertido?: boolean;
  items: DespachoItem[];
}
