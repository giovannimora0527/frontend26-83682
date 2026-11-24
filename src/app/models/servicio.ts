import { TipoServicio } from './estados';

export interface TarifaVigente {
  id: number;
  valor: number;
  impuestoId: number | null;
  porcentajeIva: number;
}

export interface ServicioRq {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipoServicio: TipoServicio;
  especializacionId: number | null;
  duracionMinutos: number;
}

export interface Servicio extends ServicioRq {
  id: number;
  especializacionNombre: string | null;
  activo: boolean;
  tarifaVigente: TarifaVigente | null;
}
