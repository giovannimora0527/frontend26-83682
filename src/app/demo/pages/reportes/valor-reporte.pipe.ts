import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TipoColumna, ValorReporte } from 'src/app/models/reporte';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';

@Pipe({ name: 'valorReporte' })
export class ValorReportePipe implements PipeTransform {
  private readonly numeros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

  transform(valor: ValorReporte | undefined, tipo: TipoColumna): string {
    if (valor === null || valor === undefined || valor === '') {
      return '';
    }
    switch (tipo) {
      case 'moneda':
        return new MonedaPipe().transform(valor);
      case 'numero':
        return this.numero(valor);
      case 'porcentaje':
        return `${this.numero(valor)} %`;
      case 'fecha':
        return formatDate(valor, 'dd/MM/yyyy', 'en-US');
      case 'fechaHora':
        return new FechaHoraPipe().transform(String(valor));
      default:
        return String(valor);
    }
  }

  private numero(valor: string | number): string {
    return Number.isNaN(Number(valor)) ? String(valor) : this.numeros.format(Number(valor));
  }
}
