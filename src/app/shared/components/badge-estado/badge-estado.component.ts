import { Component, computed, input } from '@angular/core';
import { Estado } from 'src/app/models/estados';
import { ESTADOS_UI, EstadoUi } from '../../estados-ui';

const COLORES_CLAROS = ['#f0ad4e', '#ffc107', '#fd7e14'];

@Component({
  selector: 'app-badge-estado',
  template: `
    <span class="badge" [style.background-color]="ui().color" [style.color]="colorTexto()">{{ ui().etiqueta }}</span>
  `
})
export class BadgeEstadoComponent {
  readonly estado = input.required<string | null | undefined>();

  readonly ui = computed<EstadoUi>(() => {
    const clave = (this.estado() ?? '').trim().toUpperCase();
    return ESTADOS_UI[clave as Estado] ?? { etiqueta: clave || 'Sin estado', color: '#6c757d' };
  });
  readonly colorTexto = computed(() => (COLORES_CLAROS.includes(this.ui().color) ? '#212529' : '#fff'));
}
