import { Cliente } from "./cliente";
import { Mascota } from "./mascota";
import { Medico } from "./medico";

export class Cita {
    id?: number;
    cliente?: Cliente;
    mascota?: Mascota;
    medico?: Medico;
    fechaHora?: Date;
    estado?: string;
    motivo?: string;
}
