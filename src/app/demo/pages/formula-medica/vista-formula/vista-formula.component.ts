import { Component, input } from '@angular/core';
import { ViaAdministracion } from 'src/app/models/estados';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { etiquetaDe, VIAS_ADMINISTRACION } from 'src/app/shared/catalogos';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';

/** Fórmula de solo lectura, para la consulta, la atención y la historia clínica. */
@Component({
  selector: 'app-vista-formula',
  imports: [BadgeEstadoComponent, FechaHoraPipe],
  template: `
    <p class="mb-2">
      <strong>{{ formula().numero ?? 'Sin número (borrador)' }}</strong> - {{ formula().fecha | fechaHora }} - {{ formula().medicoNombre }}
      <app-badge-estado [estado]="formula().estadoFormula" />
      @if (formula().estadoDespacho; as estado) {
        <app-badge-estado [estado]="estado" />
      }
    </p>
    @if (formula().motivoAnulacion; as motivo) {
      <p class="text-danger mb-2">Motivo de anulación: {{ motivo }}</p>
    }
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead>
          <tr>
            <th scope="col">Medicamento</th><th scope="col">Cantidad</th><th scope="col">Entregada</th><th scope="col">Dosis</th><th scope="col">Frecuencia</th><th scope="col">Duración</th><th scope="col">Vía</th>
            <th scope="col">Indicaciones</th>
          </tr>
        </thead>
        <tbody>
          @for (detalle of formula().detalles; track detalle.id) {
            <tr>
              <td>{{ detalle.medicamentoNombre }} <span class="text-muted small d-block">{{ detalle.medicamentoCodigo }} {{ detalle.presentacion }}</span></td>
              <td>{{ detalle.cantidadPrescrita }}</td>
              <td>{{ detalle.cantidadDespachada }}</td>
              <td>{{ detalle.dosis }} {{ detalle.unidadDosis }}</td>
              <td>Cada {{ detalle.frecuenciaHoras }} h</td>
              <td>{{ detalle.duracionDias }} días</td>
              <td>{{ etiquetaVia(detalle.viaAdministracion) }}</td>
              <td>{{ detalle.indicaciones || '—' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (formula().indicacionesGenerales; as indicaciones) {
      <p class="mb-0"><strong>Indicaciones generales:</strong> {{ indicaciones }}</p>
    }
  `
})
export class VistaFormulaComponent {
  readonly formula = input.required<FormulaMedica>();

  etiquetaVia(via: ViaAdministracion): string {
    return etiquetaDe(VIAS_ADMINISTRACION, via);
  }
}
