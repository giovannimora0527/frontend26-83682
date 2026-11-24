import { Component, computed, input } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { AtencionCita } from 'src/app/models/atencion';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { VistaFormulaComponent } from '../../formula-medica/vista-formula/vista-formula.component';

@Component({
  selector: 'app-antecedentes',
  imports: [NgbAccordionModule, FechaHoraPipe, VistaFormulaComponent],
  templateUrl: './antecedentes.component.html'
})
export class AntecedentesComponent {
  readonly antecedentes = input.required<AtencionCita['antecedentes']>();
  readonly vacio = computed(() => {
    const { atenciones, anotaciones, formulas } = this.antecedentes();
    return !atenciones.length && !anotaciones.length && !formulas.length;
  });
}
