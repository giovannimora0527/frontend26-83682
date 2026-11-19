import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ClinicaService, LineaFormula } from './clinica.service';

describe('ClinicaService', () => {
  let api: ClinicaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ClinicaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía varios medicamentos en un solo borrador asociado a la cita', () => {
    const linea: LineaFormula = { medicamentoId: 1, dosis: 'Dosis', frecuencia: 'Frecuencia',
      duracion: 'Duración', via: 'Oral', cantidad: 2, indicaciones: null };
    api.guardarFormula(7, null, [linea, { ...linea, medicamentoId: 2 }]).subscribe();
    const req = http.expectOne(environment.apiUrlAuth + '/atencion/citas/7/formulas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.medicamentos.length).toBe(2);
    req.flush({});
  });

  it('solicita la prefactura en PDF y no como JSON', () => {
    api.prefactura(7).subscribe();
    const req = http.expectOne(environment.apiUrlAuth + '/atencion/citas/7/prefactura');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['%PDF'], {type: 'application/pdf'}));
  });
});
