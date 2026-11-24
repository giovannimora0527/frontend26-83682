import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfiguracionClinicaComponent } from './configuracion-clinica/configuracion-clinica.component';
import { HistorialTarifasComponent } from './historial-tarifas/historial-tarifas.component';
import { ImpuestosComponent } from './impuestos/impuestos.component';
import { ListaTarifasComponent } from './lista-tarifas/lista-tarifas.component';
import { ServiciosComponent } from './servicios/servicios.component';

/** Cada pestaña se crea al abrirla, así siempre muestra datos actuales. */
@Component({
  selector: 'app-tarifas',
  imports: [NgbNavModule, ServiciosComponent, ListaTarifasComponent, ImpuestosComponent, HistorialTarifasComponent, ConfiguracionClinicaComponent],
  template: `
    <div class="card">
      <div class="card-body">
        <ul ngbNav #nav="ngbNav" class="nav-tabs" [animation]="false">
          <li ngbNavItem><button ngbNavLink type="button">Servicios</button><ng-template ngbNavContent><app-servicios /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Tarifas</button><ng-template ngbNavContent><app-lista-tarifas /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Impuestos</button><ng-template ngbNavContent><app-impuestos /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Historial de tarifas</button><ng-template ngbNavContent><app-historial-tarifas /></ng-template></li>
          <li ngbNavItem><button ngbNavLink type="button">Datos de la clínica</button><ng-template ngbNavContent><app-configuracion-clinica /></ng-template></li>
        </ul>
        <div class="pt-3" [ngbNavOutlet]="nav"></div>
      </div>
    </div>
  `
})
export class TarifasComponent {}
