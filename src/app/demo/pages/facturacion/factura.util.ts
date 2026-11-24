import { FacturaDetalle, TotalesFactura } from 'src/app/models/factura';

/** Dos decimales HALF_UP, como el backend; toFixed evita errores binarios (1.005 * 100 = 100.49999…). */
export function redondear(valor: number): number {
  return Math.round(Number((valor * 100).toFixed(6))) / 100;
}

/** Aplica el descuento al renglón; el IVA se calcula sobre la base con descuento. */
export function aplicarDescuento(detalle: FacturaDetalle, porcentaje: number): FacturaDetalle {
  const subtotal = redondear(detalle.precioUnitario * detalle.cantidad);
  const valorDescuento = redondear((subtotal * porcentaje) / 100);
  const base = redondear(subtotal - valorDescuento);
  const valorIva = redondear((base * detalle.porcentajeIva) / 100);
  return { ...detalle, subtotal, porcentajeDescuento: porcentaje, valorDescuento, valorIva, total: redondear(base + valorIva) };
}

export function totalizar(detalles: FacturaDetalle[]): TotalesFactura {
  const sumar = (campo: 'subtotal' | 'valorDescuento' | 'valorIva' | 'total') => redondear(detalles.reduce((suma, detalle) => suma + detalle[campo], 0));
  return { subtotal: sumar('subtotal'), descuentos: sumar('valorDescuento'), iva: sumar('valorIva'), total: sumar('total') };
}
