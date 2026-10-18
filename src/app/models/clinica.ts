export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  status?: number;
  error?: string;
  message?: string;
}

export interface ClienteResumen {
  id?: number;
  clienteId?: number;
  nombres?: string;
  apellidos?: string;
  numeroDocumento?: string;
}

export interface MascotaResumen {
  id?: number;
  mascotaId?: number;
  nombreMascota?: string;
  nombre?: string;
  clienteId?: number;
  cliente?: ClienteResumen | null;
}

export interface Veterinario {
  id: number;
  /** Backend identifier; `id` remains as a compatibility alias for existing screens. */
  veterinarioId?: number;
  nombres: string;
  apellidos: string;
  numeroDocumento?: string;
  registroProfesional?: string;
  especializacion?: { id?: number; nombre?: string };
}

export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA' | 'PROGRAMADA';

export interface Cita {
  id: number;
  citaId?: number;
  fechaHora?: string;
  motivo?: string;
  clienteId: number;
  mascotaId: number;
  veterinarioId: number;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  estado: EstadoCita;
  clienteNombre?: string | null;
  mascotaNombre?: string | null;
  veterinarioNombre?: string | null;
  cliente?: ClienteResumen;
  mascota?: MascotaResumen;
  veterinario?: Veterinario;
  medico?: Veterinario;
}

export type CitaRequest = Pick<Cita, 'clienteId' | 'mascotaId' | 'veterinarioId' | 'fecha' | 'hora' | 'motivoConsulta' | 'estado'>;

export interface AnotacionClinica {
  id: number;
  anotacionId?: number;
  historiaClinicaId: number;
  veterinarioId: number;
  fechaHora: string;
  descripcion: string;
  observacion: string | null;
  diagnosticoEvolucion: string | null;
  veterinarioNombre?: string;
  veterinario?: Veterinario;
}

export interface AnotacionRequest {
  historiaClinicaId: number;
  veterinarioId: number;
  fechaHora?: string;
  descripcion: string;
  observacion: string;
  diagnosticoEvolucion: string;
}

export interface HistoriaClinica {
  id: number;
  historiaClinicaId?: number;
  clienteId: number;
  mascotaId: number;
  citaId?: number | null;
  veterinarioId: number;
  fechaHora: string;
  motivoConsulta: string;
  diagnostico: string;
  observaciones?: string;
  clienteNombre?: string;
  mascotaNombre?: string;
  veterinarioNombre?: string;
  cliente?: ClienteResumen;
  mascota?: MascotaResumen;
  veterinario?: Veterinario;
  anotaciones?: AnotacionClinica[];
}

export interface HistoriaClinicaDetalle {
  historia: HistoriaClinica;
  anotaciones: PageResponse<AnotacionClinica>;
}

export interface HistoriaClinicaRequest {
  clienteId: number;
  mascotaId: number;
  veterinarioId: number;
  fechaHora: string;
  motivoConsulta: string;
  diagnostico: string;
  citaId?: number | null;
  observaciones?: string;
}

export interface FormulaMedica {
  id: number;
  formulaMedicaId?: number;
  formulaId?: number;
  mascotaId: number | null;
  historiaClinicaId?: number | null;
  veterinarioId: number;
  fechaEmision: string;
  medicamento: string;
  dosis: number | null;
  frecuencia: string | null;
  duracionDias: number | null;
  indicaciones: string;
  fechaCreacionRegistro?: string;
  clienteNombre?: string | null;
  mascotaNombre?: string | null;
  dosisTexto?: string | null;
  mascota?: MascotaResumen;
  historiaClinica?: HistoriaClinica;
  veterinario?: Veterinario;
  nombreMascota?: string;
  nombreCliente?: string;
  nombreVeterinario?: string;
}

export type FormulaMedicaRequest = Pick<FormulaMedica, 'mascotaId' | 'veterinarioId' | 'fechaEmision' | 'medicamento' | 'dosis' | 'frecuencia' | 'duracionDias' | 'indicaciones'> &
  Partial<Pick<FormulaMedica, 'historiaClinicaId'>>;
