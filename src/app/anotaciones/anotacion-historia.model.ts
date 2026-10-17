/**
 * Modelo (interface) que representa una Anotacion de Historia Medica,
 * igual que la AnotacionHistoriaDTO del backend.
 */
export interface AnotacionHistoria {
  /** Id de la anotacion. Es undefined cuando todavia no se ha guardado. */
  id?: number;

  /** Fecha de la anotacion. Si no se envia al crear, el backend la completa automaticamente. */
  fecha?: string;

  /** Texto de la anotacion. */
  descripcion: string;

  /** Id de la historia medica a la que pertenece esta anotacion. */
  historiaMedicaId: number;
  veterinarioId: number;
  nombreVeterinario?: string;
  observacion: string;
  diagnosticoEvolucion: string;
}
