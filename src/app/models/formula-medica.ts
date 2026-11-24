/** Fórmula médica asociada a una consulta (cita), mascota, veterinario e historia clínica. */
export interface FormulaMedica {
  id: number;
  citaId: number;
  mascotaId: number;
  mascota: string;
  clienteId: number;
  cliente: string;
  medicoId: number;
  veterinario: string;
  historiaId: number | null;
  medicamentoId: number;
  medicamento: string;
  presentacion: string | null;
  dosis: string;
  frecuencia: string | null;
  duracionTratamiento: string | null;
  indicaciones: string | null;
  fechaEmision: string | null;
  fechaCita: string;
  activo: boolean;
  estado: 'Activa' | 'Inactiva';
  fechaCreacionRegistro: string;
  fechaActualizacionRegistro: string | null;
}

/** Datos para crear o editar una fórmula. */
export interface FormulaRq {
  clienteId: number | null;
  mascotaId: number | null;
  citaId: number | null;
  medicoId: number | null;
  medicamentoId: number | null;
  dosis: string;
  frecuencia: string;
  duracionTratamiento: string;
  indicaciones: string | null;
  fechaEmision: string;
}
