import { EstadoDespacho, EstadoFormula, ViaAdministracion } from './estados';

export interface FormulaDetalleRq {
  medicamentoId: number;
  dosis: number;
  unidadDosis: string;
  frecuenciaHoras: number;
  duracionDias: number;
  viaAdministracion: ViaAdministracion;
  cantidadPrescrita: number;
  indicaciones: string | null;
}

export interface FormulaMedicaRq {
  citaId: number;
  indicacionesGenerales: string | null;
  detalles: FormulaDetalleRq[];
}

export interface FormulaDetalle extends FormulaDetalleRq {
  id: number;
  medicamentoCodigo: string;
  medicamentoNombre: string;
  cantidadDespachada: number;
  cantidadSugerida?: number;
  presentacion?: string | null;
  cantidadDisponibleVigente?: number;
  alcanza?: boolean;
}

export interface FormulaMedica {
  id: number;
  /** null mientras está en BORRADOR. */
  numero: string | null;
  fecha: string;
  fechaConfirmacion: string | null;
  citaId: number;
  medicoId: number;
  medicoNombre: string;
  clienteId: number;
  clienteNombre: string;
  mascotaId: number;
  mascotaNombre: string;
  indicacionesGenerales: string | null;
  estadoFormula: EstadoFormula;
  estadoDespacho: EstadoDespacho | null;
  detalles: FormulaDetalle[];
}
