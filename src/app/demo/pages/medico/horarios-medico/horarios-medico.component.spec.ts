import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Medico } from 'src/app/models/medico';
import { MedicoService } from '../service/medico.service';
import { HorariosMedicoComponent } from './horarios-medico.component';

describe('HorariosMedicoComponent', () => {
  let service: jasmine.SpyObj<MedicoService>;
  let modal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(() => {
    service = jasmine.createSpyObj<MedicoService>('MedicoService', ['listarHorarios', 'guardarHorarios']);
    modal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    service.listarHorarios.and.returnValue(of([{ id: 1, diaSemana: 1, horaInicio: '08:00:00', horaFin: '12:00:00', activo: true }]));
    service.guardarHorarios.and.returnValue(of({}));
    spyOn(Swal, 'fire');
    TestBed.configureTestingModule({
      providers: [{ provide: MedicoService, useValue: service }, { provide: NgbActiveModal, useValue: modal }]
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(HorariosMedicoComponent);
    fixture.componentInstance.medico = { id: 7, nombres: 'Ana', apellidos: 'Paz' } as Medico;
    fixture.detectChanges();
    return fixture;
  }

  it('carga los bloques por día y guarda la lista completa', () => {
    const { componentInstance: component } = crear();
    component.agregar(0);
    component.bloques(0).at(1).patchValue({ horaInicio: '12:00', horaFin: '14:00' });
    component.agregar(6);
    component.bloques(6).at(0).patchValue({ horaInicio: '09:00', horaFin: '10:00', activo: false });
    component.guardar();
    expect(service.guardarHorarios).toHaveBeenCalledOnceWith(7, [
      { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', activo: true },
      { diaSemana: 1, horaInicio: '12:00', horaFin: '14:00', activo: true },
      { diaSemana: 7, horaInicio: '09:00', horaFin: '10:00', activo: false }
    ]);
    expect(modal.close).toHaveBeenCalled();
  });

  for (const [caso, horaInicio, horaFin] of [
    ['cruzados', '11:30', '13:00'], ['al revés', '16:00', '15:00'], ['iguales', '15:00', '15:00'], ['incompletos', '15:00', '']
  ]) {
    it(`rechaza bloques ${caso}`, () => {
      const { componentInstance: component } = crear();
      component.agregar(0);
      component.bloques(0).at(1).patchValue({ horaInicio, horaFin });
      component.guardar();
      expect(service.guardarHorarios).not.toHaveBeenCalled();
      expect(component.respuestaError).toContain('Corrige');
    });
  }

  it('no permite guardar si no pudo cargar los horarios actuales', () => {
    service.listarHorarios.and.returnValue(throwError(() => new Error('x')));
    const fixture = crear();
    fixture.componentInstance.guardar();
    expect(service.guardarHorarios).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('No fue posible cargar los horarios');
  });

  it('conserva los datos si falla al guardar', () => {
    service.guardarHorarios.and.returnValue(throwError(() => new Error('x')));
    const { componentInstance: component } = crear();
    component.guardar();
    expect(component.respuestaError).toContain('No fue posible guardar');
    expect(component.bloques(0).length).toBe(1);
    expect(modal.close).not.toHaveBeenCalled();
  });
});
