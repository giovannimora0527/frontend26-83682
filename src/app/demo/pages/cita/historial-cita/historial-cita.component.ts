import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Observable } from 'rxjs';
import { Cita, HistorialEstadoCita } from 'src/app/models/cita';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { CitaService } from '../service/cita.service';

/** Modal con las citas de una mascota (mascotaId) o los cambios de una cita (citaId). */
@Component({
  selector: 'app-historial-cita',
  imports: [BadgeEstadoComponent, FechaHoraPipe],
  templateUrl: './historial-cita.component.html'
})
export class HistorialCitaComponent implements OnInit {
  @Input() mascotaId: number | null = null;
  @Input() citaId: number | null = null;
  @Input() titulo = '';

  private readonly destroyRef = inject(DestroyRef);
  private readonly citaService = inject(CitaService);
  readonly modal = inject(NgbActiveModal);

  citas: Cita[] = [];
  cambios: HistorialEstadoCita[] = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.mascotaId !== null) {
      this.consultar(this.citaService.historialMascota(this.mascotaId), (citas) => this.citas = citas);
    } else if (this.citaId !== null) {
      this.consultar(this.citaService.historialEstados(this.citaId), (cambios) => this.cambios = cambios);
    }
  }

  private consultar<T>(origen: Observable<T>, asignar: (datos: T) => void): void {
    this.cargando = true;
    this.error = '';
    origen.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: asignar,
      error: (error) => this.error = mensajeError(error, 'No fue posible cargar el historial.')
    });
  }
}
