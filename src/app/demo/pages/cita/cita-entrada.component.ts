import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CalendarioMedicoComponent } from './calendario-medico.component';
import { CitaComponent } from './cita.component';

@Component({
  selector: 'app-cita-entrada',
  imports: [CitaComponent, CalendarioMedicoComponent],
  template: '@if (esMedico) { <app-calendario-medico /> } @else { <app-cita /> }'
})
export class CitaEntradaComponent {
  readonly esMedico = (inject(AuthService).obtenerPerfil() ?? '').normalize('NFD')
    .replace(/\p{M}/gu, '').trim().toUpperCase() === 'MEDICO';
}
