import { Estado, EstadoCita, Rol } from '../models/estados';

export interface EstadoUi {
  etiqueta: string;
  color: string;
}

/** Colores de las citas según el contrato (C5). */
export const COLORES_CITA: Record<EstadoCita, string> = {
  PROGRAMADA: '#f0ad4e',
  CONFIRMADA: '#0d6efd',
  EN_ATENCION: '#6f42c1',
  ATENDIDA: '#198754',
  CANCELADA: '#6c757d'
};

const VERDE = '#198754';
const ROJO = '#dc3545';
const AMARILLO = '#ffc107';
const NARANJA = '#fd7e14';
const GRIS = '#6c757d';
const MORADO = '#6f42c1';
const NEGRO = '#212529';

/** Etiqueta y color de todos los estados del contrato. */
export const ESTADOS_UI: Record<Estado, EstadoUi> = {
  PROGRAMADA: { etiqueta: 'Programada', color: COLORES_CITA.PROGRAMADA },
  CONFIRMADA: { etiqueta: 'Confirmada', color: COLORES_CITA.CONFIRMADA },
  EN_ATENCION: { etiqueta: 'En atención', color: COLORES_CITA.EN_ATENCION },
  ATENDIDA: { etiqueta: 'Atendida', color: COLORES_CITA.ATENDIDA },
  CANCELADA: { etiqueta: 'Cancelada', color: COLORES_CITA.CANCELADA },
  BORRADOR: { etiqueta: 'Borrador', color: GRIS },
  ANULADA: { etiqueta: 'Anulada', color: ROJO },
  PENDIENTE_DESPACHO: { etiqueta: 'Pendiente de despacho', color: AMARILLO },
  EN_PREPARACION: { etiqueta: 'En preparación', color: MORADO },
  DESPACHO_PARCIAL: { etiqueta: 'Despacho parcial', color: NARANJA },
  DESPACHADO: { etiqueta: 'Despachado', color: VERDE },
  PENDIENTE_DISPONIBILIDAD: { etiqueta: 'Pendiente por disponibilidad', color: ROJO },
  CANCELADO: { etiqueta: 'Cancelado', color: GRIS },
  PENDIENTE: { etiqueta: 'Pendiente', color: AMARILLO },
  PAGO_PARCIAL: { etiqueta: 'Pago parcial', color: NARANJA },
  PAGADA: { etiqueta: 'Pagada', color: VERDE },
  AGOTADO: { etiqueta: 'Agotado', color: ROJO },
  BAJO: { etiqueta: 'Stock bajo', color: NARANJA },
  PROXIMO_VENCER: { etiqueta: 'Próximo a vencer', color: AMARILLO },
  VENCIDO: { etiqueta: 'Vencido', color: NEGRO },
  DISPONIBLE: { etiqueta: 'Disponible', color: VERDE },
  PREVISUALIZADA: { etiqueta: 'Previsualizada', color: AMARILLO },
  CONFIRMADA_CON_ERRORES: { etiqueta: 'Confirmada con errores', color: NARANJA },
  DESCARTADA: { etiqueta: 'Descartada', color: GRIS }
};

export const ETIQUETAS_ROL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  SECRETARIA: 'Secretaría',
  MEDICO: 'Médico',
  DESPACHO_MEDICO: 'Despacho médico'
};
