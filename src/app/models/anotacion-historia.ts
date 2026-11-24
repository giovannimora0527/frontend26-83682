/** Anotación de una historia clínica (evolución de la consulta). */
export interface AnotacionHistoria {
  id: number;
  historiaId: number;
  medicoId: number;
  veterinario: string;
  citaId: number | null;
  fecha: string;
  descripcion: string;
  observacion: string | null;
  diagnostico: string | null;
  fechaModificacion: string | null;
}

/** Datos para crear o actualizar una anotación. */
export interface AnotacionRq {
  historiaId: number;
  medicoId: number | null;
  descripcion: string;
  observacion: string | null;
  diagnostico: string | null;
}
