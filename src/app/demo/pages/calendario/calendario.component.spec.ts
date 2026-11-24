import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventApi, EventInput, EventSourceFuncArg } from '@fullcalendar/core';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { CitaService } from '../cita/service/cita.service';
import { MedicoService } from '../medico/service/medico.service';
import { EstadoCita } from 'src/app/models/estados';
import { EventoCalendario } from 'src/app/models/evento-calendario';
import { CalendarioComponent, CambioFecha, mapearEvento, mapearHorarios } from './calendario.component';

const evento: EventoCalendario = {
  id: 10, title: 'Firulais - Juan Pérez', start: '2099-11-24T09:00:00', end: '2099-11-24T09:30:00', estado: 'CONFIRMADA', color: '#0d6efd',
  extendedProps: {
    motivo: 'Control general', mascotaId: 1, mascotaNombre: 'Firulais', especie: 'Perro', raza: 'Criollo', edad: 3, clienteId: 4,
    clienteNombre: 'Juan Pérez', clienteTelefono: '300', clienteDocumento: '123', medicoId: 2, medicoNombre: 'Ana', servicioId: 1,
    servicioNombre: 'Consulta', motivoCancelacion: null
  }
};

describe('CalendarioComponent', () => {
  let fixture: ComponentFixture<CalendarioComponent>;
  let component: CalendarioComponent;
  let citaService: jasmine.SpyObj<CitaService>;
  let medicoService: jasmine.SpyObj<MedicoService>;
  let alerta: jasmine.Spy;
  const confirmado = (isConfirmed: boolean) => ({ isConfirmed, isDenied: false, isDismissed: !isConfirmed });
  const rango = { start: new Date(2099, 10, 23), end: new Date(2099, 10, 30) } as EventSourceFuncArg;

  beforeEach(() => {
    citaService = jasmine.createSpyObj<CitaService>('CitaService', ['calendario', 'resumenEstados', 'reprogramar']);
    citaService.calendario.and.returnValue(of([evento, { ...evento, id: 11, estado: 'CANCELADA' }]));
    citaService.resumenEstados.and.returnValue(of({ PROGRAMADA: 3, CONFIRMADA: 2, EN_ATENCION: 0, ATENDIDA: 5, CANCELADA: 1 }));
    citaService.reprogramar.and.returnValue(of({ status: 200, message: 'ok' }));
    medicoService = jasmine.createSpyObj<MedicoService>('MedicoService', ['misHorarios']);
    medicoService.misHorarios.and.returnValue(of([{ diaSemana: 7, horaInicio: '08:00', horaFin: '12:00', activo: true }]));
    alerta = spyOn(Swal, 'fire').and.resolveTo(confirmado(true));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: CitaService, useValue: citaService }, { provide: MedicoService, useValue: medicoService }
      ]
    });
    fixture = TestBed.createComponent(CalendarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mapea el color, el texto y si se puede mover según el estado', () => {
    for (const [estado, color, editable] of [
      ['PROGRAMADA', '#f0ad4e', true], ['CONFIRMADA', '#0d6efd', true], ['EN_ATENCION', '#6f42c1', false],
      ['ATENDIDA', '#198754', false], ['CANCELADA', '#6c757d', false]
    ] as [EstadoCita, string, boolean][]) {
      const mapeado = mapearEvento({ ...evento, estado });
      expect([mapeado.backgroundColor, mapeado.startEditable]).withContext(estado).toEqual([color, editable]);
    }
  });

  it('convierte los horarios activos (domingo = 0)', () => {
    expect(mapearHorarios([
      { diaSemana: 7, horaInicio: '08:00', horaFin: '12:00', activo: true }, { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', activo: false }
    ])).toEqual([{ daysOfWeek: [0], startTime: '08:00', endTime: '12:00' }]);
    expect(component.opciones().eventConstraint).toBe('businessHours');
  });

  it('carga el rango visible y oculta las canceladas por defecto', () => {
    const pedir = () => {
      let eventos: EventInput[] = [];
      component.cargarEventos(rango, (recibidos) => eventos = recibidos, fail);
      return eventos.map(({ id }) => id);
    };
    expect(pedir()).toEqual(['10']);
    expect(citaService.calendario).toHaveBeenCalledWith('2099-11-23T00:00:00', '2099-11-30T00:00:00');
    component.mostrarCanceladas = true;
    expect(pedir()).toEqual(['10', '11']);
  });

  it('muestra los contadores por estado', () => {
    component.cargarEventos(rango, () => undefined, fail);
    fixture.detectChanges();
    const valores = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('strong.fs-4')).map((e) => e.textContent);
    expect(valores).toEqual(['3', '2', '1', '5']);
  });

  it('muestra el error de carga', () => {
    citaService.calendario.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Sin médico' } })));
    const fallo = jasmine.createSpy('fallo');
    component.cargarEventos(rango, fail, fallo);
    expect(fallo).toHaveBeenCalled();
    expect(component.error()).toBe('Sin médico');
  });

  function cambio(minutos: number): CambioFecha & { revert: jasmine.Spy } {
    const inicio = new Date(2099, 10, 24, 9, 0);
    return {
      event: { start: new Date(inicio.getTime() + minutos * 60_000), extendedProps: { evento } } as unknown as EventApi,
      oldEvent: { start: inicio } as EventApi,
      revert: jasmine.createSpy('revert')
    };
  }

  it('reprograma al confirmar', async () => {
    const info = cambio(60);
    await component.reprogramar(info, false);
    expect(citaService.reprogramar).toHaveBeenCalledOnceWith(10, '2099-11-24T10:00:00');
    expect(info.revert).not.toHaveBeenCalled();
  });

  it('revierte si el usuario cancela', async () => {
    alerta.and.resolveTo(confirmado(false));
    const info = cambio(60);
    await component.reprogramar(info, false);
    expect(info.revert).toHaveBeenCalledTimes(1);
    expect(citaService.reprogramar).not.toHaveBeenCalled();
  });

  it('ante un 409 revierte y muestra el mensaje del backend', async () => {
    citaService.reprogramar.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { message: 'La cita está fuera del horario de disponibilidad del médico.' }
    })));
    const info = cambio(60);
    await component.reprogramar(info, false);
    expect(info.revert).toHaveBeenCalledTimes(1);
    expect(alerta.calls.mostRecent().args[1]).toContain('fuera del horario');
  });

  it('redimensionar solo el final se revierte sin llamar al backend', async () => {
    const info = cambio(0);
    await component.reprogramar(info, true);
    expect(info.revert).toHaveBeenCalledTimes(1);
    expect(citaService.reprogramar).not.toHaveBeenCalled();
  });
});
