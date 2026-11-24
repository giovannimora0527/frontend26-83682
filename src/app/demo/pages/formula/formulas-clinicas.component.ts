import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ClinicaService, descargarClinica, FormulaClinica, mensajeClinica } from '../../../services/clinica.service';
import { AtencionClinicaComponent } from '../cita/atencion-clinica.component';

/** Pantalla «fórmulas clínicas» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-formulas-clinicas',
  imports: [CommonModule, FormsModule, AtencionClinicaComponent],
  template: `
    <section class="card">
      <header class="card-header"><h2 class="h5 mb-0">Fórmulas por atención</h2></header>
      <div class="card-body">
        @if (error) { <p role="alert" class="alert alert-danger">{{ error }}</p> }
        <label>Seleccionar cita propia
          <select class="form-select" [(ngModel)]="elegida">
            <option [ngValue]="null">Seleccionar</option>
            @for (c of citas; track c.id) {
              <option [ngValue]="c.id">Cita {{ c.id }} · {{ c.fechaHora.replace('T',' ') }} · {{ c.estado }}</option>
            }
          </select>
        </label>
        <button type="button" class="btn btn-primary ms-2" [disabled]="!elegida" (click)="seleccionada = elegida">Abrir cita para formular</button>
        <div class="table-responsive mt-3"><table class="table table-sm align-middle">
          <thead><tr><th>Fórmula</th><th>Mascota</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (f of formulas; track f.id) {
              <tr><td>{{ f.id }}</td><td>{{ f.paciente }}</td><td>{{ f.creada | date:'short' }}</td><td>{{ f.estado }}</td>
                <td><button type="button" class="btn btn-sm btn-outline-secondary me-2" (click)="seleccionada = f.citaId">Ver atención</button>
                  @if (f.estado === 'CONFIRMADA') {
                    <button type="button" class="btn btn-sm btn-outline-primary" (click)="pdf(f)">Descargar PDF</button>
                  }
                </td></tr>
            } @empty { <tr><td colspan="5">Sin fórmulas clínicas registradas.</td></tr> }
          </tbody>
        </table></div>
        @for (id of seleccionada === null ? [] : [seleccionada]; track id) {
          <app-atencion-clinica [citaId]="id" (cierre)="seleccionada = null" (actualizada)="cargar()" />
        }
      </div>
    </section>`
})
export class FormulasClinicasComponent implements OnInit {
  /** Ruta del recurso en la API del backend. */
  private readonly api = inject(ClinicaService);
  /** Lista de citas. */
  citas: { id: number; mascotaId: number; fechaHora: string; estado: string }[] = [];
  /** Formulario reactivo: fórmulas. */
  formulas: FormulaClinica[] = [];
  /** Elegida. */
  elegida: number | null = null;
  /** Seleccionada. */
  seleccionada: number | null = null;
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit() { this.cargar(); }
  /** Carga los datos de la pantalla desde el backend. */
  cargar() {
    forkJoin({ citas: this.api.citasPropias(), formulas: this.api.formulas() }).subscribe({
      next: d => { this.citas = d.citas.filter(c => c.estado !== 'cancelada'); this.formulas = d.formulas; },
      error: async err => { this.error = await mensajeClinica(err); }
    });
  }
  /**
   * Descarga el PDF los datos de la pantalla.
   *
   * @param f f.
   */
  pdf(f: FormulaClinica) {
    this.api.formulaPdf(f.id).subscribe({
      next: b => descargarClinica(b, 'formula-' + f.id + '.pdf'),
      error: async err => { this.error = await mensajeClinica(err); }
    });
  }
}
