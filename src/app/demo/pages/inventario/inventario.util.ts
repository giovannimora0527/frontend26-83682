import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { TipoMovimiento, TipoProducto } from 'src/app/models/estados';
import { LoteRq, Producto } from 'src/app/models/producto';
import { fechaIso } from 'src/app/shared/utils/fecha.util';

export const ETIQUETAS_MOVIMIENTO: Record<TipoMovimiento, string> = {
  ENTRADA_COMPRA: 'Entrada por compra',
  ENTRADA_CARGA_MASIVA: 'Entrada por carga masiva',
  SALIDA_DESPACHO: 'Salida por despacho',
  AJUSTE_POSITIVO: 'Ajuste positivo',
  AJUSTE_NEGATIVO: 'Ajuste negativo',
  ENTRADA_REVERSION: 'Entrada por reversión'
};

export function esSalida(tipo: TipoMovimiento): boolean {
  return tipo === 'SALIDA_DESPACHO' || tipo === 'AJUSTE_NEGATIVO';
}

/** Tiene unidades que se pueden usar: si hay lotes vencidos, exige alguno vigente. */
export function tieneExistenciaVigente(producto: Producto): boolean {
  return producto.cantidadDisponible > 0 && (!producto.estadosStock.includes('VENCIDO') || producto.proximoVencimiento !== null);
}

export const validarPrecio = [Validators.required, Validators.pattern(/^\d{1,12}(\.\d{1,2})?$/)];
export const validarEntero = [Validators.required, Validators.pattern(/^\d{1,9}$/)];
export const textoObligatorio = (maximo: number) => [Validators.required, Validators.pattern(/\S/), Validators.maxLength(maximo)];

export function invimaObligatorio(tipo: () => TipoProducto | ''): (control: AbstractControl<string>) => ValidationErrors | null {
  return (control) => (tipo() === 'MEDICAMENTO' && !control.value.trim() ? { required: true } : null);
}

export type FormularioLote = FormGroup<{
  numeroLote: FormControl<string>;
  precioCompra: FormControl<number | null>;
  cantidad: FormControl<number | null>;
  fechaCompra: FormControl<string>;
  fechaIngreso: FormControl<string>;
  fechaVencimiento: FormControl<string>;
  observacion: FormControl<string>;
}>;

/** Reglas de fechas del backend. `esMedicamento` se evalúa en cada validación. */
function fechasLote(esMedicamento: () => boolean): (grupo: AbstractControl) => ValidationErrors | null {
  return (grupo) => {
    const hoy = fechaIso(new Date());
    const { fechaCompra, fechaIngreso, fechaVencimiento } = grupo.value as LoteRq;
    const errores: ValidationErrors = {};
    if (fechaCompra && fechaCompra > hoy) {
      errores['compraFutura'] = true;
    }
    if (fechaIngreso && (fechaIngreso > hoy || (fechaCompra && fechaIngreso < fechaCompra))) {
      errores['ingresoInvalido'] = true;
    }
    if (!fechaVencimiento) {
      if (esMedicamento()) {
        errores['vencimientoObligatorio'] = true;
      }
    } else if (fechaVencimiento < hoy) {
      errores['loteVencido'] = true;
    } else if (fechaCompra && fechaVencimiento <= fechaCompra) {
      errores['vencimientoInvalido'] = true;
    }
    return Object.keys(errores).length ? errores : null;
  };
}

export function crearFormularioLote(formBuilder: FormBuilder, esMedicamento: () => boolean): FormularioLote {
  return formBuilder.nonNullable.group(
    {
      numeroLote: ['', textoObligatorio(50)],
      precioCompra: formBuilder.control<number | null>(null, validarPrecio),
      cantidad: formBuilder.control<number | null>(null, [...validarEntero, Validators.min(1)]),
      fechaCompra: ['', Validators.required],
      fechaIngreso: [fechaIso(new Date()), Validators.required],
      fechaVencimiento: [''],
      observacion: ['', Validators.maxLength(500)]
    },
    { validators: fechasLote(esMedicamento) }
  );
}

export function datosLote(form: FormularioLote): LoteRq {
  const valores = form.getRawValue();
  return {
    numeroLote: valores.numeroLote.trim(),
    precioCompra: Number(valores.precioCompra),
    cantidad: Number(valores.cantidad),
    fechaCompra: valores.fechaCompra,
    fechaIngreso: valores.fechaIngreso,
    fechaVencimiento: valores.fechaVencimiento || null,
    observacion: valores.observacion.trim() || null
  };
}
