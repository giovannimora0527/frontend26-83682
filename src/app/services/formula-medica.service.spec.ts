import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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

  it('requests the list from the formula-medica endpoint', () => {
    service.listar().subscribe();

    expect(backendService.get).toHaveBeenCalledWith(
      jasmine.any(String),
      'formula-medica',
      'listar'
    );
  });

  it('sends create and update requests through the backend service', () => {
    const payload = {
      dosis: '1 tableta',
      indicaciones: 'Tomar con agua',
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-10',
      medicamento: 'Medicamento de prueba',
      paciente: 'Paciente de prueba',
      medico: 'Médico de prueba'
    };

    service.crear(payload).subscribe();
    service.actualizar(12, payload).subscribe();

    expect(backendService.post).toHaveBeenCalledWith(
      jasmine.any(String),
      'formula-medica',
      'crear',
      payload
    );
    expect(backendService.put).toHaveBeenCalledWith(
      jasmine.any(String),
      'formula-medica',
      'actualizar/12',
      payload
    );
  });
});
