import { Component, Input, OnChanges, inject } from '@angular/core';
import { PaginadorComponent } from '../../../utils/paginador.component';
import { AgendaService, CitaAnterior, errorAgenda } from '../../../services/agenda.service';

/** Pantalla «historial mascota» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-historial-mascota',
  standalone: true,
  imports: [PaginadorComponent],
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
                  <td>{{ cita.medico || 'Sin médico registrado' }}</td><td><span class="badge estado-cita" [attr.data-estado]="cita.estado">{{ cita.estado }}</span></td>
                  <td>{{ cita.atencionId ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      <app-paginador [pagina]="pagina + 1" [totalPaginas]="pagina + (hayMas ? 2 : 1)" [abierto]="hayMas"
        [deshabilitado]="cargando" (cambiar)="cargar($event - 1)">{{ citas.length }} cita(s) en esta página</app-paginador>
    </section>
  `
})
export class HistorialMascotaComponent implements OnChanges {
  /** Dependencia inyectada (AgendaService). */
  /** Identificador de mascota. */
  @Input({required:true}) mascotaId!: number;
  private readonly agenda = inject(AgendaService);
  /** Solicitud. */
  private solicitud = 0;
  /** Página actual (desde 0). */
  pagina = 0;
  /** Indica si existen más páginas. */
  hayMas = false;
  /** Indica si se está cargando. */
  cargando = false;
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Lista de citas. */
  citas: CitaAnterior[] = [];

  /** Reacciona a los cambios en las entradas del componente. */
  ngOnChanges() { this.cargar(0); }

  /**
   * Carga los datos de la pantalla desde el backend.
   *
   * @param pagina número de página.
   */
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
