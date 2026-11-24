/** Clase cliente. */
export class Cliente {
    /** Identificador de cliente. */
    clienteId?: number;
    /** Identificador de usuario. */
    usuarioId?: number;
    /** Tipo documento. */
    tipoDocumento?: string;
    /** Número documento. */
    numeroDocumento?: string;
    /** Fecha nacimiento. */
    fechaNacimiento?: Date;
    /** Nombres de la persona. */
    nombres?: string;
    /** Apellidos de la persona. */
    apellidos?: string;
    /** Número de teléfono. */
    telefono?: string;
    /** Dirección de residencia. */
    direccion?: string;
    /** Género o sexo. */
    genero?: string;
    /** Indica si el registro está activo. */
    activo?: boolean;
}