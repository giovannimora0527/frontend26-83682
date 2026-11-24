import { Cliente } from "./cliente";
import { Raza } from "./raza";

/** Clase mascota. */
export class Mascota {
    /** Identificador de mascota. */
    mascotaId?: number;
    /** Nombre mascota. */
    nombreMascota?: string;
    /** Edad de la mascota en años. */
    edad?: number;
    /** Fecha registro. */
    fechaRegistro?: Date;
    /** Raza. */
    raza?: Raza;
    /** Cliente. */
    cliente?: Cliente;
}