/** Fórmula médica asociada a una consulta (cita), mascota, veterinario e historia clínica. */
export interface FormulaMedica {
  /** Identificador único del registro. */
  id: number;
  /** Identificador de cita. */
  citaId: number;
  /** Identificador de mascota. */
  mascotaId: number;
  /** Mascota. */
  mascota: string;
  /** Identificador de cliente. */
  clienteId: number;
  /** Cliente. */
  cliente: string;
  /** Identificador de médico. */
  medicoId: number;
  /** Veterinario. */
  veterinario: string;
  /** Identificador de historia. */
  historiaId: number | null;
  /** Identificador de medicamento. */
  medicamentoId: number;
  /** Medicamento. */
  medicamento: string;
  /** Presentación. */
  presentacion: string | null;
  /** Dosis indicada (debe contener un número positivo). */
  dosis: string;
  /** Frecuencia de administración. */
  frecuencia: string | null;
  /** Duración del tratamiento (debe contener un número positivo). */
  duracionTratamiento: string | null;
  /** Indicaciones para el propietario. */
  indicaciones: string | null;
  /** Fecha emisión. */
  fechaEmision: string | null;
  /** Fecha cita. */
  fechaCita: string;
  /** Indica si el registro está activo. */
  activo: boolean;
  /** Estado actual del registro. */
  estado: 'Activa' | 'Inactiva';
  /** Fecha creación registro. */
  fechaCreacionRegistro: string;
  /** Fecha actualización registro. */
  fechaActualizacionRegistro: string | null;
  /** Orden de dispensación enlazada (formula_clinica) o null si la cita aún no se atiende. */
  ordenDespachoId?: number | null;
  /** Estado del despacho de la orden (PENDIENTE_DESPACHO, DESPACHADO, …). */
  estadoDespacho?: string | null;
  /** Unidades a dispensar calculadas según dosis, frecuencia y duración. */
  cantidadDespacho?: number | null;
}

/** Datos para crear o editar una fórmula. */
export interface FormulaRq {
  /** Identificador de cliente. */
  clienteId: number | null;
  /** Identificador de mascota. */
  mascotaId: number | null;
  /** Identificador de cita. */
  citaId: number | null;
  /** Identificador de médico. */
  medicoId: number | null;
  /** Identificador de medicamento. */
  medicamentoId: number | null;
  /** Dosis indicada (debe contener un número positivo). */
  dosis: string;
  /** Frecuencia de administración. */
  frecuencia: string;
  /** Duración del tratamiento (debe contener un número positivo). */
  duracionTratamiento: string;
  /** Indicaciones para el propietario. */
  indicaciones: string | null;
  /** Fecha emisión. */
  fechaEmision: string;
}
