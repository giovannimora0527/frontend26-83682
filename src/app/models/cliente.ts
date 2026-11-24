export class Cliente {
  id?: number;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  apellidos?: string;
  direccion?: string | null;
  fechaNacimiento?: Date | string;
  genero?: string | null;
  telefono?: string | null;
  correo?: string | null;
  activo?: boolean;
  usuarioId?: number;
}

/** El backend rechaza cualquier campo adicional. */
export interface ClienteRq {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string | null;
  telefono: string;
  correo: string | null;
  direccion: string | null;
}
