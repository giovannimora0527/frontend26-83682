import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MedicoService } from './service/medico.service';

import { MedicoComponent } from './medico.component';

describe('MedicoComponent', () => {
  let component: MedicoComponent;
  let fixture: ComponentFixture<MedicoComponent>;
  let medicoService: jasmine.SpyObj<MedicoService>;

  beforeEach(async () => {
    medicoService = jasmine.createSpyObj<MedicoService>('MedicoService', ['listarMedicos']);
    medicoService.listarMedicos.and.returnValue(of([
      { id: 1, nombres: 'Laura', apellidos: 'Pérez', registroProfesional: 'RP-1001' },
      { id: 2, nombres: 'Carlos', apellidos: 'Díaz', registroProfesional: 'RP-2002' }
    ]));

    await TestBed.configureTestingModule({
      imports: [MedicoComponent],
      providers: [{ provide: MedicoService, useValue: medicoService }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters doctors by their professional registration', () => {
    component.terminoBusqueda = 'rp-2002';
    expect(component.medicosFiltrados.length).toBe(1);
    expect(component.medicosFiltrados[0].nombres).toBe('Carlos');

    fixture.nativeElement.querySelector('button').click();
    expect(medicoService.listarMedicos).toHaveBeenCalledTimes(2);
  });
});
