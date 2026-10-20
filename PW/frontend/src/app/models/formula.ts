export class Formula {
    id?: number;
    citaId?: number;
    medicamentoId?: number;
    dosis!: string;
    indicaciones!: string;
    fechaCreacionRegistro?: string;

    cita?: any;
    medicamento?: any;
}