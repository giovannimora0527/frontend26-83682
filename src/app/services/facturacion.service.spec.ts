import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FacturacionService } from './facturacion.service';

describe('FacturacionService',()=>{
  it('envía la clave del pago y el saldo esperado con precisión decimal',()=>{
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    const api=TestBed.inject(FacturacionService);
    const http=TestBed.inject(HttpTestingController);
    const datos={clave:'00000000-0000-0000-0000-000000000001',importe:'10.05',
      saldoEsperado:'9007199254740993.01',metodo:'EFECTIVO',referencia:''};
    api.pagar(7,datos).subscribe();
    const req=http.expectOne(r=>r.url.endsWith('/facturacion/facturas/7/pagos'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush({});
    http.verify();
  });
});
