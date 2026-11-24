export interface Impuesto {
  id: number;
  nombre: string;
  porcentaje: number;
  activo: boolean;
}

export type ImpuestoRq = Omit<Impuesto, 'id'>;

export interface Tarifa {
  id: number;
  servicioId: number;
  servicioCodigo: string;
  servicioNombre: string;
  especializacionNombre: string | null;
  valor: number;
  impuestoId: number;
  impuestoNombre: string;
  porcentajeIva: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
  activa: boolean;
}

export interface TarifaCrearRq {
  servicioId: number;
  valor: number;
  impuestoId: number;
  vigenteDesde: string;
}

export interface TarifaActualizarRq {
  valor: number;
  impuestoId: number;
  motivo: string;
}

export interface HistorialTarifa {
  id: number;
  tarifaId: number;
  servicioId: number;
  servicioNombre: string;
  valorAnterior: number | null;
  valorNuevo: number;
  ivaAnterior: number | null;
  ivaNuevo: number;
  motivo: string | null;
  usuario: string;
  fecha: string;
}

export interface ConfiguracionClinica {
  nombre: string;
  nit: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  prefijoFactura: string;
  prefijoFormula: string;
  prefijoDespacho: string;
  topeDescuentoSecretaria: number;
}
