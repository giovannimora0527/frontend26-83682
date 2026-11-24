import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CalendarioMedicoComponent } from './calendario-medico.component';
import { CitaComponent } from './cita.component';

/** Pantalla «cita entrada» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-cita-entrada',
  imports: [CitaComponent, CalendarioMedicoComponent],
  template: '@if (esMedico) { <app-calendario-medico /> } @else { <app-cita /> }'
})
export class CitaEntradaComponent {
  /** Indica si es médico. */
  readonly esMedico = (inject(AuthService).obtenerPerfil() ?? '').normalize('NFD')
    .replace(/\p{M}/gu, '').trim().toUpperCase() === 'MEDICO';
}
