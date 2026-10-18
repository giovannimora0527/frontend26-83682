import { Especializacion } from "./especializacion";

export class Medico {
    /** Compatibility alias populated from the backend's `veterinarioId`. */
    id!: number;
    veterinarioId?: number;
    tipoDocumento!: string;
    numeroDocumento!: string;
    nombres!: string;
    apellidos!: string;
    telefono!: string;
    registroProfesional!: string;
    especializacion!: Especializacion;
}
