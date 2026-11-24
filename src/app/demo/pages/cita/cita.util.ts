import { Cita } from 'src/app/models/cita';
import { EstadoCita } from 'src/app/models/estados';

/** Duración que aplica el backend a las citas sin servicio. */
export const DURACION_SIN_SERVICIO = 30;

export function estadoCita(estado: string | null | undefined): EstadoCita {
  return (estado ?? '').trim().toUpperCase() as EstadoCita;
}

/** Solo las citas programadas o confirmadas se editan, reprograman o cancelan. */
export function esEditable(estado: string | null | undefined): boolean {
  return ['PROGRAMADA', 'CONFIRMADA'].includes(estadoCita(estado));
}

export function duracionCita(cita: Pick<Cita, 'servicio'>): number {
  return cita.servicio?.duracionMinutos ?? DURACION_SIN_SERVICIO;
}
