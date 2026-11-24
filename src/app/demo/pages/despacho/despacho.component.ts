import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { BandejaComponent } from './bandeja/bandeja.component';
import { HistorialMedicamentoComponent } from './historial-medicamento/historial-medicamento.component';
import { LogDespachosComponent } from './log-despachos/log-despachos.component';

@Component({
  selector: 'app-despacho',
  imports: [NgbNavModule, BandejaComponent, LogDespachosComponent, HistorialMedicamentoComponent],
  template: `
    <div class="card">
      <div class="card-body">
        <ul ngbNav #nav="ngbNav" class="nav-tabs" [animation]="false">
          <li ngbNavItem><button ngbNavLink type="button">Fórmulas pendientes</button><ng-template ngbNavContent><app-bandeja /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Log de despachos</button><ng-template ngbNavContent><app-log-despachos /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Historial por medicamento</button><ng-template ngbNavContent><app-historial-medicamento /></ng-template></li>
        </ul>
        <div class="pt-3" [ngbNavOutlet]="nav"></div>
      </div>
    </div>
  `
})
export class DespachoComponent {}
