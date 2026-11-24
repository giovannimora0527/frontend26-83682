import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CitaService } from '../cita/service/cita.service';
import { EventoCalendario } from 'src/app/models/evento-calendario';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { fechaIso } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';

/** Citas de hoy del médico autenticado. */
@Component({
  selector: 'app-atencion',
  imports: [DatePipe, RouterLink, BadgeEstadoComponent],
  templateUrl: './atencion.component.html'
})
export class AtencionComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly citaService = inject(CitaService);

  pendientes: EventoCalendario[] = [];
  atendidas: EventoCalendario[] = [];
  cargando = false;
  error = '';

  constructor() {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.error = '';
    const hoy = fechaIso(new Date());
    this.citaService.calendario(hoy, hoy).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (citas) => {
        const ordenadas = [...citas].sort((a, b) => a.start.localeCompare(b.start));
        this.pendientes = ordenadas.filter(({ estado }) => ['PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION'].includes(estado));
        this.atendidas = ordenadas.filter(({ estado }) => estado === 'ATENDIDA');
      },
      error: (error) => this.error = mensajeError(error, 'No fue posible cargar las citas de hoy.')
    });
  }
}
