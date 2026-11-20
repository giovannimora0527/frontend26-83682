import { HistorialMascotaComponent } from './historial-mascota.component';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgendaService, CambioCita, errorAgenda, EventoMedico, hoyBogota, RevisionCita } from '../../../services/agenda.service';
import { AtencionClinicaComponent } from './atencion-clinica.component';
import { AgendaConfiguracionComponent } from './agenda-configuracion.component';

type Vista = 'dia' | 'semana' | 'mes';
interface DiaCalendario { fecha: string; dia: number; nombre: string; otroMes: boolean; citas: EventoMedico[]; }

@Component({
  selector: 'app-calendario-medico',
  imports: [HistorialMascotaComponent, FormsModule, AgendaConfiguracionComponent, AtencionClinicaComponent],
  templateUrl: './calendario-medico.component.html',
  styleUrl: './calendario-medico.component.scss'
})
export class CalendarioMedicoComponent implements OnInit {
  mascotaHistorial: number | null = null;
  private readonly agenda = inject(AgendaService);
  private readonly formatoDia = new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' });
  private readonly formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  readonly estados = ['pendiente', 'confirmada', 'cancelada', 'atendida', 'finalizada'];
  readonly vistas: { id: Vista; nombre: string }[] = [
    { id: 'dia', nombre: 'Día' }, { id: 'semana', nombre: 'Semana' }, { id: 'mes', nombre: 'Mes' }
  ];
  readonly hoy = hoyBogota();
  vista: Vista = 'semana';
  fecha = this.hoy;
  desde = this.hoy;
  hasta = this.hoy;
  exportarDesde = this.hoy;
  exportarHasta = this.hoy;
  estado = '';
  dias: DiaCalendario[] = [];
  evento: EventoMedico | null = null;
  inicio = '';
  fin = '';
  historial: RevisionCita[] = [];
  verHorario = false;
  atencionId: number | null = null;
  cargando = false;
  guardando = false;
  error = '';
  aviso = '';
  private consulta = 0;

  ngOnInit() { this.cargar(true); }

  get titulo() {
    if (this.vista === 'mes') return this.formatoMes.format(this.fechaUtc(this.fecha));
    if (this.vista === 'dia') return this.fecha;
    return this.desde + ' a ' + this.hasta;
  }

  seleccionarVista(vista: Vista) { this.vista = vista; this.cargar(true); }

  seleccionarFecha(fecha: string) {
    if (!fecha) return;
    this.fecha = fecha;
    this.cargar(true);
  }

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
      otroMes: this.vista === 'mes' && dia.getUTCMonth() !== this.fechaUtc(this.fecha).getUTCMonth(), citas: []
    }));
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

  reservada(cita: EventoMedico) { return cita.estado === 'pendiente' || cita.estado === 'confirmada'; }

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

  private fechaUtc(valor: string) { return new Date(valor + 'T00:00:00Z'); }
  private iso(fecha: Date) { return fecha.toISOString().slice(0, 10); }
}
