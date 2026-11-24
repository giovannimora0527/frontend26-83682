import { DespachoDetalle } from 'src/app/models/despacho';
import { EstadoDespacho } from 'src/app/models/estados';

export const ESTADOS_PENDIENTES: EstadoDespacho[] = ['PENDIENTE_DESPACHO', 'EN_PREPARACION', 'DESPACHO_PARCIAL', 'PENDIENTE_DISPONIBILIDAD'];

export const SIN_FILTRO = { texto: '', desde: '', hasta: '', estado: '' };

/**
 * Estado en que quedaría la fórmula al confirmar (tabla de reglas-negocio.md). Es informativo: decide el backend.
 * `entregas` tiene la cantidad a entregar por formulaDetalleId.
 */
export function estadoEsperado(detalles: DespachoDetalle[], entregas: ReadonlyMap<number, number>): EstadoDespacho {
  const entrega = (detalle: DespachoDetalle) => entregas.get(detalle.formulaDetalleId) ?? 0;
  if (detalles.every((detalle) => detalle.cantidadPendiente <= entrega(detalle))) {
    return 'DESPACHADO';
  }
  if (detalles.some((detalle) => detalle.cantidadDespachada + entrega(detalle) > 0)) {
    return 'DESPACHO_PARCIAL';
  }
  return detalles.some((detalle) => detalle.cantidadPendiente > 0 && detalle.existenciaTotalVigente > 0)
    ? 'PENDIENTE_DESPACHO' : 'PENDIENTE_DISPONIBILIDAD';
}
