import { Component, Input, OnChanges, inject } from '@angular/core';
import { AgendaService, CitaAnterior, errorAgenda } from '../../../services/agenda.service';

@Component({
  selector: 'app-historial-mascota',
  standalone: true,
  template: `
    <section class="border rounded p-3 my-2">
      <h3 class="h6">Historial de citas de la mascota</h3>
      @if (error) { <p class="text-danger" role="alert">{{ error }}</p> }
      @if (cargando) { <p role="status">Cargando citas anteriores…</p> }
      @if (!cargando && !error && !citas.length) { <p>No hay citas anteriores para mostrar.</p> }
      @if (citas.length) {
        <div class="table-responsive">
          <table class="table table-sm mb-2">
            <thead><tr><th>Cita</th><th>Inicio y fin</th><th>Médico</th><th>Estado</th><th>Atención</th></tr></thead>
            <tbody>
              @for (cita of citas; track cita.id) {
                <tr>
                  <td>{{ cita.id }}</td>
                  <td>{{ cita.inicio.replace('T',' ') }} – {{ cita.fin.replace('T',' ') }}</td>
                  <td>{{ cita.medico || 'Sin médico registrado' }}</td><td>{{ cita.estado }}</td>
                  <td>{{ cita.atencionId ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      <button type="button" class="btn btn-sm btn-outline-secondary me-2" [disabled]="cargando || pagina===0"
        (click)="cargar(pagina-1)">Anterior</button>
      <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="cargando || !hayMas"
        (click)="cargar(pagina+1)">Siguiente</button>
    </section>
  `
})
export class HistorialMascotaComponent implements OnChanges {
  @Input({required:true}) mascotaId!: number;
  private readonly agenda = inject(AgendaService);
  private solicitud = 0;
  pagina = 0;
  hayMas = false;
  cargando = false;
  error = '';
  citas: CitaAnterior[] = [];

  ngOnChanges() { this.cargar(0); }

  cargar(pagina: number) {
    const solicitud = ++this.solicitud;
    this.cargando = true;
    this.citas = [];
    this.error = '';
    this.hayMas = false;
    this.agenda.historialMascota(this.mascotaId, pagina).subscribe({
      next: datos => {
        if (solicitud !== this.solicitud) return;
        this.citas = datos.citas;
        this.hayMas = datos.hayMas;
        this.pagina = pagina;
        this.cargando = false;
      },
      error: error => {
        if (solicitud !== this.solicitud) return;
        this.error = errorAgenda(error);
        this.cargando = false;
      }
    });
  }
}
