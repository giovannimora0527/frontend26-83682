import { Component, input, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Atajo, rangoAtajo, RangoFechas } from '../../utils/fecha.util';

let contador = 0;

/** Rango de fechas con atajos. Emite el rango cuando es válido y null cuando no lo es. */
@Component({
  selector: 'app-filtro-fechas',
  imports: [FormsModule],
  templateUrl: './filtro-fechas.component.html'
})
export class FiltroFechasComponent implements OnInit {
  readonly inicial = input<RangoFechas | null>(null);
  readonly obligatorio = input(false);
  readonly cambio = output<RangoFechas | null>();

  readonly id = `filtro-fechas-${contador++}`;
  readonly atajos: { clave: Atajo; titulo: string }[] = [
    { clave: 'hoy', titulo: 'Hoy' },
    { clave: 'semana', titulo: 'Esta semana' },
    { clave: 'mes', titulo: 'Este mes' },
    { clave: 'mesAnterior', titulo: 'Mes anterior' },
    { clave: 'anio', titulo: 'Este año' }
  ];
  desde = '';
  hasta = '';

  ngOnInit(): void {
    this.desde = this.inicial()?.desde ?? '';
    this.hasta = this.inicial()?.hasta ?? '';
  }

  get error(): string {
    if (this.desde && this.hasta && this.desde > this.hasta) {
      return 'La fecha inicial no puede ser posterior a la final.';
    }
    return this.obligatorio() && (!this.desde || !this.hasta) ? 'Selecciona la fecha inicial y la final.' : '';
  }

  aplicar(atajo: Atajo): void {
    ({ desde: this.desde, hasta: this.hasta } = rangoAtajo(atajo));
    this.emitir();
  }

  emitir(): void {
    this.cambio.emit(this.error ? null : { desde: this.desde, hasta: this.hasta });
  }
}
