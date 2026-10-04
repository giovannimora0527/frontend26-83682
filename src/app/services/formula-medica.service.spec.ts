import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { BackendService } from 'src/app/services/backend.service';
import { FormulaMedicaService } from './formula-medica.service';

describe('FormulaMedicaService', () => {
  let service: FormulaMedicaService;
  let backendService: jasmine.SpyObj<BackendService>;

  beforeEach(() => {
    backendService = jasmine.createSpyObj<BackendService>(
      'BackendService',
      ['get', 'post', 'put']
    );
    backendService.get.and.returnValue(of([]));
    backendService.post.and.returnValue(of({}));
    backendService.put.and.returnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        FormulaMedicaService,
        { provide: BackendService, useValue: backendService }
      ]
    });
    service = TestBed.inject(FormulaMedicaService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('lists demo formulas and creates and updates them in memory', () => {
    const payload = {
      dosis: '1 tableta',
      indicaciones: 'Tomar con agua',
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-10',
      medicamento: 'Medicamento de prueba',
      paciente: 'Paciente de prueba',
      medico: 'Médico de prueba'
    };

    let formulas: FormulaMedica[] = [];
    service.listar().subscribe((resultado) => formulas = resultado);
    expect(formulas.length).toBe(1);
    expect(formulas[0].id).toBe(1);

    let creadaId: number | undefined;
    service.crear(payload).subscribe((resultado) => creadaId = resultado.id);
    expect(creadaId).toBe(2);

    const payloadActualizado = { ...payload, dosis: '2 tabletas' };
    service.actualizar(2, payloadActualizado).subscribe();
    service.listar().subscribe((resultado) => formulas = resultado);
    expect(formulas.find((formula) => formula.id === 2)?.dosis).toBe('2 tabletas');

    expect(backendService.get).not.toHaveBeenCalled();
    expect(backendService.post).not.toHaveBeenCalled();
    expect(backendService.put).not.toHaveBeenCalled();
  });
});
