import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AgendaService } from '../../../services/agenda.service';
import { CalendarioMedicoComponent } from './calendario-medico.component';

describe('Calendario médico', () => {
  const eventos = jasmine.createSpy('eventos').and.returnValue(of([{
    id: 1, inicio: '2026-11-23T09:00:00', fin: '2026-11-23T09:30:00', estado: 'confirmada',
    medico: 'Médico de prueba', mascota: 'Paciente QA', propietario: 'Propietario QA', motivo: 'Consulta'
  }]));
  const historial = jasmine.createSpy('historial').and.returnValue(of([]));

  beforeEach(() => {
    eventos.calls.reset();
    TestBed.configureTestingModule({
      imports: [CalendarioMedicoComponent],
      providers: [{ provide: AgendaService, useValue: { eventos, historial } }]
    });
  });

  it('calcula el día, semana de lunes a domingo y cuadrícula mensual', () => {
    const c = TestBed.createComponent(CalendarioMedicoComponent).componentInstance;
    c.seleccionarFecha('2026-11-23');
    expect(eventos).toHaveBeenCalledWith('2026-11-23', '2026-11-29', '');
    c.seleccionarVista('dia');
    expect(eventos).toHaveBeenCalledWith('2026-11-23', '2026-11-23', '');
    expect(c.dias[0].citas[0].mascota).toBe('Paciente QA');
    c.seleccionarVista('mes');
    expect(c.dias.length % 7).toBe(0);
    expect(c.exportarDesde).toBe('2026-11-01');
    expect(c.exportarHasta).toBe('2026-11-30');
  });

  it('conserva el filtro de estado y el día ISO durante la navegación', () => {
    const c = TestBed.createComponent(CalendarioMedicoComponent).componentInstance;
    c.estado = 'confirmada';
    c.seleccionarFecha('2026-11-23');
    c.navegar(1);
    expect(eventos).toHaveBeenCalledWith('2026-11-30', '2026-12-06', 'confirmada');
  });
});
