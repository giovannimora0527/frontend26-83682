/** Clase usuario. */
export class Usuario {
    /** Identificador único del registro. */
    id?: number;
    /** Nombre de usuario. */
    username?: string;
    /** Hash de la contraseña. */
    password_hash?: string;
    /** Rol del usuario. */
    rol?: string;
    /** Correo electrónico. */
    email?: string;
    /** Fecha creación. */
    fechaCreacion?: Date;
    /** Indica si el registro está activo. */
    activo?: boolean;
}