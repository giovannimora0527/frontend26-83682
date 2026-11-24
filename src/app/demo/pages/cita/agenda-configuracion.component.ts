import { Component, inject, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { AgendaService, Ausencia, errorAgenda, HorarioMedico, hoyBogota } from '../../../services/agenda.service';

/** Pantalla «agenda configuración» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-agenda-configuracion',
  imports: [FormsModule],
  templateUrl: './agenda-configuracion.component.html'
})
export class AgendaConfiguracionComponent implements OnChanges {
  /** Dependencia inyectada (AgendaService). */
  private readonly servicio = inject(AgendaService);
  /** Lista de días. */
  /** Médico. */
  @Input() medico: number | null = null;
  readonly dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  /** Datos. */
  datos: HorarioMedico | null = null;
  /** Ausencia. */
  ausencia = this.ausenciaInicial();
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Mensaje mostrado al usuario (aviso). */
  aviso = '';
  /** Indica si ocupado. */
  ocupado = false;

  /** Reacciona a los cambios en las entradas del componente. */
  ngOnChanges() { this.datos = null; this.cargar(); }
  /** Carga los datos de la pantalla desde el backend. */
  cargar() { this.ejecutar(this.servicio.configuracion(this.medico)); }

  /** Agrega los datos de la pantalla. */
  agregar() { this.datos?.horarios.push({ dia: 1, inicio: '08:00', fin: '17:00' }); }

  /** Guarda los datos de la pantalla validando el formulario y enviándolo al backend. */
  guardar() {
    if (!this.datos) return;
    this.ejecutar(this.servicio.guardarHorarios(this.medico, this.datos.horarios), 'Horario semanal guardado.');
  }

  /** Registra los datos de la pantalla. */
  registrar() {
    this.ejecutar(this.servicio.registrarAusencia(this.medico, this.ausencia), 'Ausencia registrada.', true);
  }

  /** Alterna actividad. */
  alternarActividad() {
    if (this.medico === null || !this.datos || !confirm('¿Cambiar el estado del médico?')) return;
    this.ocupado = true;
    this.error = '';
    this.servicio.actividad(this.medico, !this.datos.activo).subscribe({
      next: () => this.cargar(),
      error: err => { this.ocupado = false; this.error = errorAgenda(err); }
    });
  }

  /**
   * Ejecuta los datos de la pantalla.
   *
   * @param peticion peticion.
   * @param aviso aviso.
   * @param limpiarAusencia limpiar ausencia.
   */
  private ejecutar(peticion: Observable<HorarioMedico>, aviso = '', limpiarAusencia = false) {
    this.error = '';
    this.aviso = '';
    this.ocupado = true;
    peticion.pipe(finalize(() => { this.ocupado = false; })).subscribe({
      next: datos => {
        this.datos = { ...datos, horarios: datos.horarios.map(f => ({ ...f, inicio: f.inicio.slice(0, 8), fin: f.fin.slice(0, 8) })) };
        this.aviso = aviso;
        if (limpiarAusencia) this.ausencia = this.ausenciaInicial();
      },
      error: err => { this.error = errorAgenda(err); }
    });
  }

  /**
   * Ausencia inicial.
   *
   * @returns resultado de ausencia inicial.
   */
  private ausenciaInicial(): Ausencia {
    const hoy = hoyBogota();
    return { inicio: hoy + 'T08:00', fin: hoy + 'T09:00', motivo: '' };
  }
}
