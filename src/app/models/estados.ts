/** Roles y estados del contrato (C2 y C5). */
export type Rol = 'ADMINISTRADOR' | 'SECRETARIA' | 'MEDICO' | 'DESPACHO_MEDICO';

export type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'EN_ATENCION' | 'ATENDIDA' | 'CANCELADA';
export type EstadoFormula = 'BORRADOR' | 'CONFIRMADA' | 'ANULADA';
export type EstadoDespacho =
  | 'PENDIENTE_DESPACHO'
  | 'EN_PREPARACION'
  | 'DESPACHO_PARCIAL'
  | 'DESPACHADO'
  | 'PENDIENTE_DISPONIBILIDAD'
  | 'CANCELADO';
export type EstadoPreparacion = 'EN_PREPARACION' | 'CONFIRMADO' | 'CANCELADO' | 'REVERTIDO';
export type EstadoFactura = 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADA' | 'ANULADA';
export type EstadoStock = 'AGOTADO' | 'BAJO' | 'PROXIMO_VENCER' | 'VENCIDO' | 'DISPONIBLE';
export type EstadoCarga = 'PREVISUALIZADA' | 'CONFIRMADA' | 'CONFIRMADA_CON_ERRORES' | 'DESCARTADA';
export type Estado = EstadoCita | EstadoFormula | EstadoDespacho | EstadoPreparacion | EstadoFactura | EstadoStock | EstadoCarga;

export type TipoProducto = 'MEDICAMENTO' | 'INSUMO';
export type TipoMovimiento =
  | 'ENTRADA_COMPRA'
  | 'ENTRADA_CARGA_MASIVA'
  | 'SALIDA_DESPACHO'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'ENTRADA_REVERSION';
export type MedioPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA';
export type TipoServicio = 'CONSULTA' | 'PROCEDIMIENTO' | 'VACUNACION' | 'CIRUGIA' | 'LABORATORIO' | 'OTRO';
export type ViaAdministracion =
  | 'ORAL'
  | 'TOPICA'
  | 'OFTALMICA'
  | 'OTICA'
  | 'SUBCUTANEA'
  | 'INTRAMUSCULAR'
  | 'INTRAVENOSA'
  | 'OTRA';
export type AccionCarga = 'NUEVO_PRODUCTO' | 'NUEVO_LOTE';
export type FormatoArchivo = 'pdf' | 'xlsx' | 'csv';
