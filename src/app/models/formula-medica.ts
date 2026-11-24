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
}

export interface FormulaMedica {
  id: number;
  numero: string;
  fecha: string;
  citaId: number;
  medicoNombre: string;
  clienteNombre: string;
  mascotaNombre: string;
  indicacionesGenerales: string | null;
  estadoFormula: EstadoFormula;
  estadoDespacho: EstadoDespacho | null;
  detalles: FormulaDetalle[];
}
