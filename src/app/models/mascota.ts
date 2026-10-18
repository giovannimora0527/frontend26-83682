import { Cliente } from "./cliente";
import { Raza } from "./raza";

export class Mascota {
    mascotaId?: number;
    nombreMascota?: string;
    edad?: number;
    fechaRegistro?: string | Date;
    cliente?: Cliente | null;
    raza?: Raza | null;
    razaId?: number;
    clienteId?: number;
}
