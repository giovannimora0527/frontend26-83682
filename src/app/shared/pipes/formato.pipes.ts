import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

/** Pesos colombianos; solo muestra decimales cuando los hay. */
@Pipe({ name: 'moneda' })
export class MonedaPipe implements PipeTransform {
  transform(valor: number | string | null | undefined): string {
    const numero = Number(valor);
    if (valor === null || valor === undefined || valor === '' || Number.isNaN(numero)) {
      return '';
    }
    const redondeado = Math.round(numero * 100) / 100;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: Number.isInteger(redondeado) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(redondeado);
  }
}

@Pipe({ name: 'fechaHora' })
export class FechaHoraPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    return valor ? formatDate(valor, 'dd/MM/yyyy HH:mm', 'en-US') : '';
  }
}
