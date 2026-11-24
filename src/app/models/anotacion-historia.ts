/** Anotación de una historia clínica (evolución de la consulta). */
export interface AnotacionHistoria {
  /** Identificador único del registro. */
  id: number;
  /** Identificador de historia. */
  historiaId: number;
  /** Identificador de médico. */
  medicoId: number;
  /** Veterinario. */
  veterinario: string;
  /** Identificador de cita. */
  citaId: number | null;
  /** Fecha (AAAA-MM-DD). */
  fecha: string;
  /** Descripción. */
  descripcion: string;
  /** Observación clínica. */
  observacion: string | null;
  /** Diagnóstico clínico. */
  diagnostico: string | null;
  /** Fecha modificación. */
  fechaModificacion: string | null;
}

/** Datos para crear o actualizar una anotación. */
export interface AnotacionRq {
  /** Identificador de historia. */
  historiaId: number;
  /** Identificador de médico. */
  medicoId: number | null;
  /** Descripción. */
  descripcion: string;
  /** Observación clínica. */
  observacion: string | null;
  /** Diagnóstico clínico. */
  diagnostico: string | null;
}
