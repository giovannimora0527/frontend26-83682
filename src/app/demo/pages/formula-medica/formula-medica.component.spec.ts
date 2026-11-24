import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { environment } from 'src/environments/environment';
import { FormulaMedicaComponent } from './formula-medica.component';

describe('FormulaMedicaComponent', () => {
  const api = `${environment.apiUrlAuth}/formula-medica/listar`;
  let component: FormulaMedicaComponent;
  let fixture: ComponentFixture<FormulaMedicaComponent>;
  let http: HttpTestingController;
  const formula = {
    id: 1, numero: 'FM-000001', fecha: '2026-11-24T10:00:00', mascotaNombre: 'Luna', clienteNombre: 'Juan', medicoNombre: 'Ana', indicacionesGenerales: null,
    estadoFormula: 'CONFIRMADA', estadoDespacho: 'DESPACHADO', detalles: [{ id: 1, medicamentoNombre: 'Amoxicilina', medicamentoCodigo: 'AMX00500', indicaciones: 'Después de comer' }]
  } as FormulaMedica;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FormulaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lista las fórmulas y pagina de 10', () => {
    http.expectOne(api).flush(Array.from({ length: 12 }, (_, i) => ({ ...formula, id: i + 1 })));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('se crean dentro de la atención médica');
  });

  it('busca en las indicaciones y medicamentos sin distinguir tildes', () => {
    http.expectOne(api).flush([formula, { ...formula, id: 2, detalles: [] }]);
    for (const termino of ['despues', 'amoxicilina', 'amx00500']) {
      component.tabla.termino = termino;
      expect(component.tabla.filtradas.map(({ id }) => id)).withContext(termino).toEqual([1]);
    }
  });

  it('filtra por fechas y estado en el backend', () => {
    http.expectOne(api);
    component.filtro.estado = 'ANULADA';
    component.filtrarFechas({ desde: '2026-11-01', hasta: '2026-11-30' });
    http.expectOne(`${api}?desde=2026-11-01&hasta=2026-11-30&estado=ANULADA`);
    component.filtrarFechas(null);
    http.expectNone(api);
  });
});
