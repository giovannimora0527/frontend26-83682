import { EstadoCita } from './estados';
import { FormulaMedica } from './formula-medica';

export interface AtencionServicio {
  servicioId: number;
  cantidad: number;
}

export interface AtencionRq {
  motivoConsulta: string;
  sintomas: string;
  diagnostico: string;
  observaciones: string | null;
  recomendaciones: string | null;
  servicios: AtencionServicio[];
}

export interface Atencion extends AtencionRq {
  id: number;
  citaId: number;
  fechaInicio: string;
  fechaFin: string | null;
  finalizada: boolean;
}

export interface AtencionCita {
  atencion: Atencion;
  cita: { id: number; fechaInicio: string; fechaFin: string; estado: EstadoCita; motivo: string };
  mascota: { id: number; nombre: string; especie: string; raza: string; edad: number };
  propietario: { id: number; nombre: string; documento: string; telefono: string };
  antecedentes: { atenciones: Atencion[]; formulas: FormulaMedica[] };
}
