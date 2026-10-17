import { Cliente } from "./cliente";
import { Raza } from "./raza";

export class Mascota {
    mascotaId?: number;
    nombreMascota?: string;
    edad?: number;
    fechaRegistro?: Date;
    fechaModificacion?: Date;
    raza?: Raza;
    cliente?: Cliente;
}