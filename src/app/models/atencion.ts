import { EstadoCita } from './estados';
import { FormulaMedica } from './formula-medica';

export interface AtencionServicioRq {
  servicioId: number;
  cantidad: number;
}

export interface AtencionServicio extends AtencionServicioRq {
  servicioCodigo: string;
  servicioNombre: string;
}

interface DatosAtencion {
  motivoConsulta: string | null;
  sintomas: string | null;
  diagnostico: string | null;
  observaciones: string | null;
  recomendaciones: string | null;
}

export interface AtencionRq extends DatosAtencion {
  servicios: AtencionServicioRq[];
}

export interface Atencion extends DatosAtencion {
  id: number;
  citaId: number;
  medicoId: number;
  medicoNombre: string;
  estadoCita: EstadoCita;
  servicios: AtencionServicio[];
  fechaInicio: string;
  fechaFin: string | null;
  finalizada: boolean;
}

export interface AnotacionAntecedente {
  id: number;
  fecha: string;
  medicoNombre: string;
  descripcion: string;
  diagnostico: string | null;
  observaciones: string | null;
}

export interface AtencionCita {
  /** null si la atención no se ha iniciado. */
  atencion: Atencion | null;
  cita: {
    id: number;
    fechaInicio: string;
    fechaFin: string;
    estado: EstadoCita;
    motivo: string;
    servicioId: number | null;
    servicioNombre: string | null;
  };
  mascota: { id: number; nombre: string; especie: string; raza: string; edad: number; activo: boolean };
  propietario: { id: number; nombre: string; documento: string; telefono: string | null; correo: string | null };
  antecedentes: { atenciones: Atencion[]; anotaciones: AnotacionAntecedente[]; formulas: FormulaMedica[] };
}
