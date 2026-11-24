/** Respuesta de los endpoints de creación, edición y acciones (C1). */
export interface RespuestaApi<T = unknown> {
  status: number;
  message: string;
  data?: T;
}

export interface DetalleError {
  campo: string;
  mensaje: string;
}

/** Cuerpo de las respuestas 4xx y 5xx (C1). */
export interface ErrorApi {
  status: number;
  error: string;
  message: string;
  detalles?: DetalleError[];
}

export interface CambioEstado {
  estadoAnterior: string | null;
  estadoNuevo: string;
  usuario: string;
  fecha: string;
  motivo?: string | null;
}
