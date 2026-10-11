import { HistoriaMedica } from "./historia-medica";
import { Medico } from "./medico";

export class AnotacionHistoria {
    id?: number;
    historiaMedica?: HistoriaMedica;
    medico?: Medico;
    fecha?: Date;
    descripcion?: string;
}
