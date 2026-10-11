import { Cita } from "./cita";
import { Medicamento } from "./medicamento";

export class FormulaMedica {
    id?: number;
    cita?: Cita;
    medicamento?: Medicamento;
    dosis?: string;
    indicaciones?: string;
    fechaCreacionRegistro?: Date;
    fechaActualizacionRegistro?: Date;
}
