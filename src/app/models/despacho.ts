import { EstadoDespacho, EstadoFormula, EstadoPreparacion, ViaAdministracion } from './estados';

export interface FormulaPendiente {
  formulaId: number;
  numero: string;
  fecha: string;
  medicoNombre: string;
  clienteNombre: string;
  mascotaNombre: string;
  totalMedicamentos: number;
  indicacionesGenerales: string | null;
  estadoDespacho: EstadoDespacho;
  /** null si nadie la prepara. */
  usuarioPreparacion: string | null;
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
  /** null si no hay preparación abierta. */
  despachoId: number | null;
  despachoNumero: string | null;
  usuarioPreparacion: string | null;
  numero: string;
  fecha: string;
  medicoNombre: string;
  clienteNombre: string;
  clienteDocumento: string;
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
  medicamentoId: number;
  medicamentoNombre: string;
  numeroLote: string;
  fechaVencimiento: string | null;
  facturado: boolean;
}

export interface Despacho {
  id: number;
  numero: string;
  formulaId: number;
  formulaNumero: string;
  fecha: string;
  fechaInicio: string;
  mascotaNombre: string;
  clienteNombre: string;
  medicoNombre: string;
  usuario: string;
  /** Estado del despacho. */
  estado: EstadoPreparacion;
  /** Estado actual de la fórmula. */
  estadoDespacho: EstadoDespacho;
  observacion: string | null;
  revertido: boolean;
  fechaReversion: string | null;
  usuarioReversion: string | null;
  motivoReversion: string | null;
  items: DespachoItem[];
  sinExistencias: string[];
}

export interface DespachoMedicamento {
  despachoId: number;
  despachoNumero: string;
  formulaId: number;
  formulaNumero: string;
  fecha: string;
  usuario: string;
  medicoNombre: string;
  clienteNombre: string;
  mascotaNombre: string;
  loteId: number;
  numeroLote: string;
  cantidad: number;
  estado: EstadoPreparacion;
  movimientoId: number | null;
  saldoLote: number | null;
  saldo: number | null;
  movimientoReversionId: number | null;
}

export interface HistorialFormula {
  id: number;
  estadoAnterior: EstadoDespacho | null;
  estadoNuevo: EstadoDespacho | null;
  estadoFormulaAnterior: EstadoFormula | null;
  estadoFormulaNuevo: EstadoFormula;
  motivo: string | null;
  usuario: string;
  fecha: string;
}
