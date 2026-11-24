import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { fechaIso } from 'src/app/shared/utils/fecha.util';
import { esInvalido } from 'src/app/shared/utils/formulario.util';
import { FormularioLote } from '../inventario.util';

/** Campos de un lote, comunes al lote inicial y a las entradas por compra. */
@Component({
  selector: 'app-campos-lote',
  imports: [ReactiveFormsModule],
  templateUrl: './campos-lote.component.html'
})
export class CamposLoteComponent {
  readonly formulario = input.required<FormularioLote>();
  readonly esMedicamento = input.required<boolean>();
  readonly hoy = fechaIso(new Date());
  readonly esInvalido = esInvalido;

  get form(): FormularioLote {
    return this.formulario();
  }
}
