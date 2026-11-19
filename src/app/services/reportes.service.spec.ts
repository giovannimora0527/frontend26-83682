import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReportesService } from './reportes.service';

describe('ReportesService',()=>{
  it('usa los mismos filtros para vista previa y descarga sin arrastrar la página',()=>{
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    const api=TestBed.inject(ReportesService);
    const http=TestBed.inject(HttpTestingController);
    const filtros={desde:'2026-11-01',hasta:'2026-11-19',agrupacion:'MES'};
    api.consultar('FINANCIERO',{...filtros,pagina:2}).subscribe();
    const consulta=http.expectOne(r=>r.url.endsWith('/reportes/FINANCIERO'));
    expect(consulta.request.params.get('pagina')).toBe('2');
    expect(consulta.request.params.get('agrupacion')).toBe('MES');
    consulta.flush({});
    api.descargar('FINANCIERO','excel',filtros).subscribe();
    const descarga=http.expectOne(r=>r.url.endsWith('/reportes/FINANCIERO/excel'));
    expect(descarga.request.params.has('pagina')).toBeFalse();
    expect(descarga.request.params.get('desde')).toBe(filtros.desde);
    expect(descarga.request.responseType).toBe('blob');
    descarga.flush(new Blob());
    http.verify();
  });
});
