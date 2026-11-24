import { HistorialMascotaComponent } from './historial-mascota.component';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgendaService, Ausencia, CambioCita, errorAgenda, EventoMedico, hoyBogota, RevisionCita } from '../../../services/agenda.service';
import { AtencionClinicaComponent } from './atencion-clinica.component';
import { AgendaConfiguracionComponent } from './agenda-configuracion.component';

/** Tipo «Vista»: valores permitidos para vista. */
type Vista = 'dia' | 'semana' | 'mes';
/** Modelo de datos «DiaCalendario» que se intercambia con el backend. */
interface DiaCalendario { fecha: string; dia: number; nombre: string; otroMes: boolean; citas: EventoMedico[]; ausencias: Ausencia[]; }

/** Pantalla «calendario médico» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-calendario-medico',
  imports: [HistorialMascotaComponent, FormsModule, AgendaConfiguracionComponent, AtencionClinicaComponent],
  templateUrl: './calendario-medico.component.html',
  styleUrl: './calendario-medico.component.scss'
})
export class CalendarioMedicoComponent implements OnInit {
  /** Mascota historial. */
  mascotaHistorial: number | null = null;
  /** Dependencia inyectada (AgendaService). */
  private readonly agenda = inject(AgendaService);
  /** Formulario reactivo: formato día. */
  private readonly formatoDia = new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' });
  /** Formulario reactivo: formato mes. */
  private readonly formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  /** Lista de estados. */
  readonly estados = ['pendiente', 'programada', 'confirmada', 'cancelada', 'atendida', 'finalizada'];
  /** Lista de vistas. */
  readonly vistas: { id: Vista; nombre: string }[] = [
    { id: 'dia', nombre: 'Día' }, { id: 'semana', nombre: 'Semana' }, { id: 'mes', nombre: 'Mes' }
  ];
  /** Fecha de hoy (AAAA-MM-DD). */
  readonly hoy = hoyBogota();
  /** Vista. */
  vista: Vista = 'semana';
  /** Fecha (AAAA-MM-DD). */
  fecha = this.hoy;
  /** Fecha inicial del rango. */
  desde = this.hoy;
  /** Fecha final del rango. */
  hasta = this.hoy;
  /** Exportar desde. */
  exportarDesde = this.hoy;
  /** Exportar hasta. */
  exportarHasta = this.hoy;
  /** Estado actual del registro. */
  estado = '';
  /** Lista de días. */
  dias: DiaCalendario[] = [];
  /** Evento. */
  evento: EventoMedico | null = null;
  /** Fecha y hora de inicio. */
  inicio = '';
  /** Fecha y hora de fin. */
  fin = '';
  /** Lista de historial. */
  historial: RevisionCita[] = [];
  /** Indica si ver horario. */
  verHorario = false;
  /** Identificador de atención. */
  atencionId: number | null = null;
  /** Indica si se está cargando. */
  cargando = false;
  /** Indica si se está guardando. */
  guardando = false;
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Mensaje mostrado al usuario (aviso). */
  aviso = '';
  /** Consulta. */
  private consulta = 0;

  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit() { this.cargar(true); }

  /**
   * Titulo.
   *
   * @returns titulo.
   */
  get titulo() {
    if (this.vista === 'mes') return this.formatoMes.format(this.fechaUtc(this.fecha));
    if (this.vista === 'dia') return this.fecha;
    return this.desde + ' a ' + this.hasta;
  }

  /**
   * Selecciona vista.
   *
   * @param vista vista.
   */
  seleccionarVista(vista: Vista) { this.vista = vista; this.cargar(true); }

  /**
   * Selecciona fecha.
   *
   * @param fecha fecha (AAAA-MM-DD).
   */
  seleccionarFecha(fecha: string) {
    if (!fecha) return;
    this.fecha = fecha;
    this.cargar(true);
  }

  /**
   * Navega a los datos de la pantalla.
   *
   * @param paso paso.
   */
  navegar(paso: number) {
    const fecha = this.fechaUtc(this.fecha);
    if (this.vista === 'mes') {
      fecha.setUTCDate(1);
      fecha.setUTCMonth(fecha.getUTCMonth() + paso);
    } else {
      fecha.setUTCDate(fecha.getUTCDate() + paso * (this.vista === 'semana' ? 7 : 1));
    }
    this.seleccionarFecha(this.iso(fecha));
  }

  /**
   * Carga los datos de la pantalla desde el backend.
   *
   * @param reiniciarExportacion reiniciar exportacion.
   */
  cargar(reiniciarExportacion = false) {
    const fechas = this.fechasVista();
    this.desde = this.iso(fechas[0]);
    this.hasta = this.iso(fechas[fechas.length - 1]);
    if (reiniciarExportacion) {
      const primero = this.fechaUtc(this.fecha);
      primero.setUTCDate(1);
      const ultimo = new Date(primero);
      ultimo.setUTCMonth(ultimo.getUTCMonth() + 1, 0);
      this.exportarDesde = this.vista === 'mes' ? this.iso(primero) : this.desde;
      this.exportarHasta = this.vista === 'mes' ? this.iso(ultimo) : this.hasta;
    }
    const solicitud = ++this.consulta;
    this.cargando = true;
    this.error = '';
    this.evento = null;
    this.dias = fechas.map(dia => ({
      fecha: this.iso(dia), dia: dia.getUTCDate(), nombre: this.formatoDia.format(dia),
      otroMes: this.vista === 'mes' && dia.getUTCMonth() !== this.fechaUtc(this.fecha).getUTCMonth(), citas: [], ausencias: []
    }));
    this.agenda.ausenciasPropias(this.desde, this.hasta).subscribe({
      next: ausencias => {
        if (solicitud !== this.consulta) return;
        for (const dia of this.dias) {
          const siguiente = this.iso(new Date(this.fechaUtc(dia.fecha).getTime() + 86400000));
          dia.ausencias = ausencias.filter(a => a.inicio.slice(0, 10) < siguiente && a.fin.slice(0, 19) > dia.fecha + 'T00:00:00');
        }
      },
      error: () => undefined
    });
    this.agenda.eventos(this.desde, this.hasta, this.estado).subscribe({
      next: resultados => {
        if (solicitud !== this.consulta) return;
        const porDia = new Map(this.dias.map(dia => [dia.fecha, dia.citas]));
        for (const cita of resultados) porDia.get(cita.inicio.slice(0, 10))?.push(cita);
        this.cargando = false;
      },
      error: err => {
        if (solicitud !== this.consulta) return;
        this.error = errorAgenda(err);
        this.cargando = false;
      }
    });
  }

  /**
   * Selecciona los datos de la pantalla.
   *
   * @param evento evento.
   */
  seleccionar(evento: EventoMedico) {
    this.evento = evento;
    this.inicio = evento.inicio.slice(0, 16);
    this.fin = evento.fin.slice(0, 16);
    this.historial = [];
    this.agenda.historial(evento.id).subscribe({
      next: filas => { if (this.evento?.id === evento.id) this.historial = filas; },
      error: err => { if (this.evento?.id === evento.id) this.error = errorAgenda(err); }
    });
  }

  /**
   * Cambia los datos de la pantalla.
   *
   * @param evento evento.
   * @param cambios cambios.
   */
  cambiar(evento: EventoMedico, cambios: CambioCita) {
    if (!confirm('¿Guardar el cambio de la cita?')) return;
    this.guardando = true;
    this.error = '';
    this.agenda.cambiar(evento.id, cambios).subscribe({
      next: () => {
        this.guardando = false;
        this.aviso = 'Cita actualizada.';
        this.cargar();
      },
      error: err => { this.guardando = false; this.error = errorAgenda(err); }
    });
  }

  /** Descarga los datos de la pantalla como archivo. */
  descargar() {
    if (!this.exportarDesde || !this.exportarHasta || this.exportarHasta < this.exportarDesde) {
      this.error = 'Selecciona un rango válido para exportar.';
      return;
    }
    const desde = this.exportarDesde, hasta = this.exportarHasta;
    this.agenda.excel(desde, hasta, this.estado).subscribe({
      next: blob => {
        const recurso = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = recurso;
        link.download = 'citas-' + desde + '-' + hasta + '.xlsx';
        link.click();
        setTimeout(() => URL.revokeObjectURL(recurso), 0);
      },
      error: async err => {
        try { this.error = errorAgenda({ error: JSON.parse(await (err.error as Blob).text()) }); }
        catch { this.error = 'No se pudo exportar el calendario.'; }
      }
    });
  }

  /**
   * Reservada.
   *
   * @param cita cita seleccionada.
   */
  /**
   * Texto del bloqueo de una ausencia en un día del calendario.
   *
   * @param a ausencia.
   * @param fecha día de la celda (AAAA-MM-DD).
   * @returns horario de la ausencia en ese día ("Todo el día" si lo cubre completo).
   */
  horarioAusencia(a: Ausencia, fecha: string): string {
    const desde = a.inicio.slice(0, 10) < fecha ? '00:00' : a.inicio.slice(11, 16);
    const hasta = a.fin.slice(0, 10) > fecha ? '24:00' : a.fin.slice(11, 16);
    return desde === '00:00' && hasta === '24:00' ? 'Todo el día' : desde + '–' + hasta;
  }

  /** Abre o cierra la configuración de horarios y ausencias; al cerrarla refresca el calendario. */
  alternarHorario() {
    this.verHorario = !this.verHorario;
    if (!this.verHorario) this.cargar();
  }

  reservada(cita: EventoMedico) { return ['pendiente', 'programada', 'confirmada'].includes(cita.estado); }

  /** Fechas vista. */
  private fechasVista() {
    const fecha = this.fechaUtc(this.fecha);
    if (this.vista === 'dia') return [fecha];
    const inicio = new Date(fecha);
    if (this.vista === 'mes') inicio.setUTCDate(1);
    inicio.setUTCDate(inicio.getUTCDate() - (inicio.getUTCDay() + 6) % 7);
    let cantidad = 7;
    if (this.vista === 'mes') {
      const ultimo = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0));
      cantidad = Math.ceil(((ultimo.getTime() - inicio.getTime()) / 86_400_000 + 1) / 7) * 7;
    }
    return Array.from({ length: cantidad }, (_, i) => {
      const dia = new Date(inicio);
      dia.setUTCDate(dia.getUTCDate() + i);
      return dia;
    });
  }

  /**
   * Fecha UTC.
   *
   * @param valor valor recibido.
   */
  private fechaUtc(valor: string) { return new Date(valor + 'T00:00:00Z'); }
  /**
   * ISO.
   *
   * @param fecha fecha (AAAA-MM-DD).
   */
  private iso(fecha: Date) { return fecha.toISOString().slice(0, 10); }
}
