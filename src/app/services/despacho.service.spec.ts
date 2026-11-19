import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DespachoService } from './despacho.service';

describe('DespachoService', () => {
  it('envía una clave estable en la preparación y confirma por ID', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(DespachoService);
    const http = TestBed.inject(HttpTestingController);
    const lotes = [{ medicamento: 2, lote: 5, cantidad: 6 }];
    api.preparar(3, '00000000-0000-0000-0000-000000000001', lotes).subscribe();
    const plan = http.expectOne(r => r.url.endsWith('/despacho/formulas/3/preparar'));
    expect(plan.request.method).toBe('POST');
    expect(plan.request.body).toEqual({ clave: '00000000-0000-0000-0000-000000000001', lotes });
    plan.flush({ id: 9, lotes });
    api.confirmar(9).subscribe();
    const confirmar = http.expectOne(r => r.url.endsWith('/despacho/entregas/9/confirmar'));
    expect(confirmar.request.method).toBe('POST');
    confirmar.flush({});
    http.verify();
  });
});
