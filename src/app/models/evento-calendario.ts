import { EstadoCita } from './estados';

export interface EventoCalendario {
  id: number;
  title: string;
  start: string;
  end: string;
  estado: EstadoCita;
  color: string;
  extendedProps: {
    motivo: string;
    mascotaId: number;
    mascotaNombre: string;
    especie: string;
    raza: string;
    edad: number;
    clienteId: number;
    clienteNombre: string;
    clienteTelefono: string;
    clienteDocumento: string;
    medicoId: number;
    medicoNombre: string;
    servicioId: number | null;
    servicioNombre: string | null;
    motivoCancelacion: string | null;
  };
}

export type ResumenEstadosCita = Record<EstadoCita, number>;
