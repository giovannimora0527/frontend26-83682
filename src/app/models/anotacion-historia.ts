import { Medico } from './medico';
import { Historia } from './historia';
import { Cita } from './cita';
import { FormulaMedica } from './formula-medica';

export class AnotacionHistoria {
    id!: number;
    descripcion!: string;
    diagnostico?: string | null;
    observaciones?: string | null;
    fecha!: Date | string;
    historia!: Historia;
    medico!: Medico;
    cita?: Cita | null;
    formulasMedicas?: FormulaMedica[] | null;
}
