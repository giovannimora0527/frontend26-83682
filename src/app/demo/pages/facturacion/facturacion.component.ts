import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { HistorialFacturasComponent } from './historial-facturas/historial-facturas.component';
import { ListaFacturasComponent } from './lista-facturas/lista-facturas.component';
import { PorFacturarComponent } from './por-facturar/por-facturar.component';

@Component({
  selector: 'app-facturacion',
  imports: [NgbNavModule, PorFacturarComponent, ListaFacturasComponent, HistorialFacturasComponent],
  template: `
    <div class="card">
      <div class="card-body">
        <ul ngbNav #nav="ngbNav" class="nav-tabs" [animation]="false">
          <li ngbNavItem><button ngbNavLink type="button">Por facturar</button><ng-template ngbNavContent><app-por-facturar /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Facturas</button><ng-template ngbNavContent><app-lista-facturas /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Historial</button><ng-template ngbNavContent><app-historial-facturas /></ng-template></li>
        </ul>
        <div class="pt-3" [ngbNavOutlet]="nav"></div>
      </div>
    </div>
  `
})
export class FacturacionComponent {}
