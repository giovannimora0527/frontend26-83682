export interface Impuesto {
  id: number;
  nombre: string;
  porcentaje: number;
  activo?: boolean;
}

export type ImpuestoRq = Omit<Impuesto, 'id'>;

export interface Tarifa {
  id: number;
  servicioId: number;
  servicioNombre: string;
  valor: number;
  impuestoId: number | null;
  porcentajeIva: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
}

export interface TarifaCrearRq {
  servicioId: number;
  valor: number;
  impuestoId: number | null;
  vigenteDesde: string;
}

export interface TarifaActualizarRq {
  valor: number;
  impuestoId: number | null;
  motivo: string;
}

export interface HistorialTarifa {
  id: number;
  tarifaId: number;
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
  direccion: string;
  telefono: string;
  correo: string;
  prefijoFactura: string;
  topeDescuentoSecretaria?: number;
}
