/** Bloque de disponibilidad. diaSemana: 1 = lunes … 7 = domingo; horas en HH:mm. */
export interface Horario {
  id?: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}
