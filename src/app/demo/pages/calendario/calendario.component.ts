import { Component, computed, DestroyRef, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import {
  BusinessHoursInput, CalendarOptions, DateSelectArg, EventApi, EventClickArg, EventInput, EventSourceFuncArg
} from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CitaService } from '../cita/service/cita.service';
import { esEditable } from '../cita/cita.util';
import { MedicoService } from '../medico/service/medico.service';
import { EstadoCita } from 'src/app/models/estados';
import { EventoCalendario, ResumenEstadosCita } from 'src/app/models/evento-calendario';
import { Horario } from 'src/app/models/horario';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { COLORES_CITA, ESTADOS_UI } from 'src/app/shared/estados-ui';
import { fechaHoraIso, rangoAtajo, RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { DetalleCitaComponent } from './detalle-cita/detalle-cita.component';
import { NuevaCitaComponent } from './nueva-cita/nueva-cita.component';

/** Lo común entre arrastrar y redimensionar un evento. */
export interface CambioFecha {
  event: EventApi;
  oldEvent: EventApi;
  revert: () => void;
}

export function mapearEvento(evento: EventoCalendario): EventInput {
  const editable = esEditable(evento.estado);
  return {
    id: String(evento.id),
    title: evento.title,
    start: evento.start,
    end: evento.end,
    backgroundColor: COLORES_CITA[evento.estado] ?? evento.color,
    borderColor: COLORES_CITA[evento.estado] ?? evento.color,
    textColor: evento.estado === 'PROGRAMADA' ? '#212529' : '#ffffff',
    startEditable: editable,
    durationEditable: editable,
    extendedProps: { evento }
  };
}

/** Horas disponibles para FullCalendar (0 = domingo). */
export function mapearHorarios(horarios: Horario[]): BusinessHoursInput {
  return horarios.filter(({ activo }) => activo).map(({ diaSemana, horaInicio, horaFin }) => ({
    daysOfWeek: [diaSemana % 7], startTime: horaInicio, endTime: horaFin
  }));
}

@Component({
  selector: 'app-calendario',
  imports: [FormsModule, FullCalendarModule, BotonDescargaComponent, FiltroFechasComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss'
})
export class CalendarioComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly citaService = inject(CitaService);
  private readonly medicoService = inject(MedicoService);
  private readonly calendario = viewChild(FullCalendarComponent);
  private modal?: NgbModalRef;
  private consultaResumen?: Subscription;

  readonly estadosUi = ESTADOS_UI;
  readonly leyenda: EstadoCita[] = ['PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION', 'ATENDIDA', 'CANCELADA'];
  readonly contadores: { estado: EstadoCita; titulo: string }[] = [
    { estado: 'PROGRAMADA', titulo: 'Pendientes' },
    { estado: 'CONFIRMADA', titulo: 'Confirmadas' },
    { estado: 'CANCELADA', titulo: 'Canceladas' },
    { estado: 'ATENDIDA', titulo: 'Finalizadas' }
  ];

  readonly resumen = signal<ResumenEstadosCita | null>(null);
  readonly error = signal('');
  readonly errorHorarios = signal('');
  readonly sinHorarios = signal(false);
  readonly cargando = signal(false);
  private readonly horarios = signal<BusinessHoursInput | null>(null);
  mostrarCanceladas = false;
  rangoReporte: RangoFechas | null = null;

  private readonly opcionesBase: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    locale: esLocale,
    initialView: window.innerWidth < 768 ? 'listWeek' : 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:15:00',
    snapDuration: '00:15:00',
    allDaySlot: false,
    eventDisplay: 'block',
    nowIndicator: true,
    navLinks: true,
    dayMaxEvents: true,
    height: 'auto',
    selectable: true,
    selectMirror: true,
    eventResizableFromStart: true,
    selectAllow: ({ start, allDay }) => !allDay && start.getTime() > Date.now(),
    eventAllow: ({ start }) => start.getTime() > Date.now(),
    events: (info, exito, fallo) => this.cargarEventos(info, exito, fallo),
    loading: (cargando) => this.cargando.set(cargando),
    eventClick: (info) => this.abrirDetalle(info),
    eventDrop: (info) => void this.reprogramar(info, false),
    eventResize: (info) => void this.reprogramar(info, true),
    select: (info) => this.nuevaCita(info),
    dateClick: (info) => this.irAlDia(info)
  };

  readonly opciones = computed<CalendarOptions>(() => {
    const horarios = this.horarios();
    return horarios === null
      ? this.opcionesBase
      : { ...this.opcionesBase, businessHours: horarios, selectConstraint: 'businessHours', eventConstraint: 'businessHours' };
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.cargarHorarios();
  }

  cargarHorarios(): void {
    this.errorHorarios.set('');
    this.medicoService.misHorarios().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (horarios) => {
        this.sinHorarios.set(!horarios.some(({ activo }) => activo));
        this.horarios.set(mapearHorarios(horarios));
      },
      error: (error) => this.errorHorarios.set(mensajeError(error, 'No fue posible cargar tus horarios.'))
    });
  }

  cargarEventos(info: EventSourceFuncArg, exito: (eventos: EventInput[]) => void, fallo: (error: Error) => void): void {
    const desde = fechaHoraIso(info.start);
    const hasta = fechaHoraIso(info.end);
    this.error.set('');
    this.citaService.calendario(desde, hasta).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (eventos) => exito(eventos.filter(({ estado }) => this.mostrarCanceladas || estado !== 'CANCELADA').map(mapearEvento)),
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible cargar las citas.'));
        fallo(error);
      }
    });
    this.consultaResumen?.unsubscribe();
    this.consultaResumen = this.citaService.resumenEstados(desde, hasta).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resumen) => this.resumen.set(resumen),
      error: () => this.resumen.set(null)
    });
  }

  recargar(): void {
    this.calendario()?.getApi().refetchEvents();
  }

  /** Arrastrar mueve el inicio. La duración la define el servicio, así que cambiar solo el fin no aplica. */
  async reprogramar(info: CambioFecha, redimension: boolean): Promise<void> {
    const evento = info.event.extendedProps['evento'] as EventoCalendario;
    const inicio = info.event.start;
    if (!inicio || (redimension && inicio.getTime() === info.oldEvent.start?.getTime())) {
      info.revert();
      void Swal.fire('Duración fija', 'La duración de la cita depende de su servicio. Mueve la cita para cambiar la hora de inicio.', 'info');
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Reprogramar la cita?',
      text: `${evento.title}: nueva fecha ${inicio.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}.`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'Reprogramar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      info.revert();
      return;
    }
    this.citaService.reprogramar(evento.id, fechaHoraIso(inicio)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ message }) => {
        this.recargar();
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error) => {
        info.revert();
        if ([400, 404, 409].includes(error?.status)) {
          void Swal.fire('No se pudo reprogramar', mensajeError(error, 'Intenta nuevamente.'), 'error');
        }
      }
    });
  }

  abrirDetalle(info: Pick<EventClickArg, 'event' | 'jsEvent'>): void {
    info.jsEvent.preventDefault();
    this.modal = this.modalService.open(DetalleCitaComponent, { size: 'lg', scrollable: true, ariaLabelledBy: 'detalleCitaTitulo' });
    this.modal.componentInstance.evento = info.event.extendedProps['evento'];
    this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cambio) => {
      if (cambio) {
        this.recargar();
      }
    });
  }

  nuevaCita({ start }: Pick<DateSelectArg, 'start'>): void {
    this.calendario()?.getApi().unselect();
    this.modal = this.modalService.open(NuevaCitaComponent, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'nuevaCitaTitulo'
    });
    this.modal.componentInstance.inicio = start;
    this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recargar());
  }

  /** En la vista de mes no hay hora: se abre el día para elegir la franja. */
  irAlDia({ allDay, date, view }: Pick<DateClickArg, 'allDay' | 'date' | 'view'>): void {
    if (allDay && view.type === 'dayGridMonth') {
      view.calendar.changeView('timeGridDay', date);
    }
  }

  abrirReporte(contenido: TemplateRef<unknown>): void {
    this.rangoReporte = rangoAtajo('mes');
    this.modal = this.modalService.open(contenido, { size: 'lg', ariaLabelledBy: 'reporteTitulo' });
  }
}
