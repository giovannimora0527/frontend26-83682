import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PacientesRoutingModule } from './pacientes-routing.module';
import { PacienteListComponent } from './paciente-list/paciente-list.component';
import { PacienteFormComponent } from './paciente-form/paciente-form.component';

/**
 * Modulo de gestion de Pacientes.
 *
 * Agrupa todo lo relacionado con la tabla "paciente": sus componentes
 * (lista y formulario), su propio enrutamiento interno
 * (PacientesRoutingModule) y los modulos de Angular que sus plantillas
 * necesitan (CommonModule para *ngIf/*ngFor, FormsModule para [(ngModel)]).
 *
 * Se carga de forma perezosa (lazy loading) desde app-routing.module.ts,
 * por eso aqui NO se usa "bootstrap" ni se declara en AppModule.
 */
@NgModule({
  declarations: [
    PacienteListComponent,
    PacienteFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PacientesRoutingModule
  ]
})
export class PacientesModule { }
